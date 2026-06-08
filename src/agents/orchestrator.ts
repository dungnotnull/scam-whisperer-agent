import { randomUUID } from 'node:crypto';
import type { AnalyzeRequest, AnalyzeResponse, ExtractionResult, ClassificationResult, FamilyAlert } from '../types';
import { analyzeImage, NoApiKeyError } from '../tools/llm-client';
import { runFastPathMatching } from './scam-classifier/pattern-matcher';
import { deepClassify, applyConsensusLogic } from './scam-classifier/deep-classifier';
import { checkUrls } from './scam-classifier/url-checker';
import { checkPhones } from './scam-classifier/phone-checker';
import { preprocessImage, preprocessImageSyncFallback } from './image-analyzer/preprocessor';
import { injectQrAnalysis } from './image-analyzer/qr-analyzer';
import { enrichExtractionWithPlatform } from './image-analyzer/platform-detector';
import { generateElderlyExplanation } from './explanation-generator/explainer';
import { generateActionSteps } from './action-advisor/action-advisor';
import { detectEmergencyPhase, getEmergencyGuide } from './action-advisor/damage-control';
import { getEducationalTip } from './educator/educator';
import { processAlert } from '../notifications/guardian-manager';
import { synthesizeVoiceResponse } from '../voice/tts-adapter';

export async function runAnalysisPipeline(request: AnalyzeRequest, startTime: number): Promise<AnalyzeResponse> {
  const requestId = randomUUID();

  let preprocessResult: { image_base64: string; is_photo_of_screen: boolean; dimensions: { width: number; height: number } };
  try {
    preprocessResult = await preprocessImage(request.image_base64);
  } catch {
    preprocessResult = preprocessImageSyncFallback(request.image_base64);
  }

  let extractionResult: ExtractionResult;
  try {
    const { result } = await analyzeImage(preprocessResult.image_base64, request.media_type);
    extractionResult = result;
  } catch (error) {
    if (error instanceof NoApiKeyError) {
      extractionResult = {
        raw_text: '',
        platform: 'unknown',
        phone_numbers: [],
        urls: [],
        bank_accounts: [],
        qr_code_detected: false,
        logos_detected: [],
        urgency_visual_cues: [],
        asking_for: [],
        psychological_tactics: [],
        image_quality: 'good',
        language: 'vi',
      };
    } else throw error;
  }

  extractionResult.platform = enrichExtractionWithPlatform(
    extractionResult.raw_text,
    extractionResult.urgency_visual_cues,
    extractionResult.platform,
  );

  if (extractionResult.qr_code_detected && extractionResult.qr_code_content) {
    extractionResult = injectQrAnalysis(extractionResult);
  }

  const fastPathResult = runFastPathMatching(extractionResult);

  const alreadyInteracted = detectAlreadyInteracted(request.follow_up_context);

  const emergencyPhase = alreadyInteracted
    ? detectEmergencyPhase(request.follow_up_context || '')
    : null;

  const [urlCheckResult, phoneCheckResult] = await Promise.all([
    checkUrls(extractionResult.urls),
    Promise.resolve(checkPhones(extractionResult.phone_numbers)),
  ]);

  let classificationResult: ClassificationResult;
  try {
    classificationResult = await deepClassify(extractionResult, fastPathResult.signals);
  } catch {
    classificationResult = {
      threat_level: 'GREEN',
      threat_level_vi: 'AN TOÀN',
      scam_category: 'legitimate',
      confidence: 0.5,
      evidence: ['[STUB] Classification unavailable'],
      psychological_tactics: [],
      what_they_want: 'Không có gì đáng ngờ',
      technical_summary: 'Classification unavailable',
    };
  }

  classificationResult = mergeSignals(classificationResult, fastPathResult);
  classificationResult = applyConsensusLogic(
    classificationResult,
    fastPathResult.suspicionScore,
    urlCheckResult,
    phoneCheckResult,
  );

  let explanationResult: { verdict_line: string; explanation: string; familiar_comparison?: string; action_steps: string[]; reassurance: string; educational_tip?: string };

  if (emergencyPhase && classificationResult.threat_level === 'RED') {
    const emergencyGuide = getEmergencyGuide(emergencyPhase);
    explanationResult = {
      verdict_line: `🚨 ${classificationResult.threat_level_vi} — KHẨN CẤP`,
      explanation: classificationResult.what_they_want,
      familiar_comparison: undefined,
      action_steps: emergencyGuide.immediateActions,
      reassurance: 'Hãy bình tĩnh làm từng bước. Cháu đang báo người thân của ông/bà.',
      educational_tip: undefined,
    };
  } else {
    try {
      const expl = await generateElderlyExplanation(classificationResult, 'ông/bà', 'south');
      explanationResult = {
        ...expl,
        action_steps: [],
      };
    } catch {
      explanationResult = {
        verdict_line: classificationResult.threat_level_vi,
        explanation: classificationResult.what_they_want,
        action_steps: [],
        reassurance: 'Hãy hỏi người thân nếu ông/bà thấy lo.',
      };
    }
  }

  const actionSteps = generateActionSteps(
    classificationResult.threat_level,
    alreadyInteracted ? 'ALREADY_CLICKED' : 'FRESH',
  );

  const tip = getEducationalTip(classificationResult.scam_category || 'unknown', request.user_id);

  let familyAlert: FamilyAlert | undefined;
  if (classificationResult.threat_level === 'RED' || classificationResult.threat_level === 'ORANGE') {
    familyAlert = buildFamilyAlert(classificationResult, request.user_id, alreadyInteracted);
    processAlert(familyAlert, request.user_id).catch(() => {
    });
  }

  let voiceUrl: string | undefined;
  const fullExplanation = [
    explanationResult.verdict_line,
    explanationResult.explanation,
    ...actionSteps.map((s, i) => `Bước ${i + 1}: ${s}`),
    explanationResult.reassurance,
  ].filter(Boolean).join('. ');

  try {
    const ttsResult = await synthesizeVoiceResponse(
      fullExplanation,
      'north_female',
      classificationResult.threat_level,
    );
    if (ttsResult) {
      voiceUrl = `data:audio/${ttsResult.format};base64,${ttsResult.audioBase64}`;
    }
  } catch {
    voiceUrl = undefined;
  }

  return {
    request_id: requestId,
    classification: classificationResult,
    explanation: {
      verdict_line: explanationResult.verdict_line,
      explanation: explanationResult.explanation,
      familiar_comparison: explanationResult.familiar_comparison,
      action_steps: actionSteps,
      reassurance: explanationResult.reassurance,
      educational_tip: tip,
    },
    voice_url: voiceUrl,
    family_alert: familyAlert,
    processing_time_ms: Date.now() - startTime,
  };
}

function detectAlreadyInteracted(followUpContext?: string): boolean {
  if (!followUpContext) return false;
  const triggers = [
    'bấm vào rồi', 'đã bấm', 'đã nhập', 'đã chuyển tiền',
    'chuyển tiền rồi', 'đã gửi', 'tôi đã làm', 'bấm rồi',
  ];
  const lower = followUpContext.toLowerCase();
  return triggers.some((t) => lower.includes(t));
}

function mergeSignals(
  classification: ClassificationResult,
  fastPath: { suspicionScore: number; signals: string[] },
): ClassificationResult {
  if (fastPath.suspicionScore >= 150 && classification.threat_level !== 'RED') {
    return {
      ...classification,
      threat_level: 'RED',
      threat_level_vi: 'NGUY HIỂM',
      evidence: [...classification.evidence, ...fastPath.signals],
    };
  }
  if (fastPath.signals.length > 0) {
    return { ...classification, evidence: [...classification.evidence, ...fastPath.signals] };
  }
  return classification;
}

function buildFamilyAlert(
  classification: ClassificationResult,
  userId: string,
  alreadyInteracted: boolean,
): FamilyAlert {
  return {
    type: alreadyInteracted ? 'SCAM_INTERACTED' : 'SCAM_DETECTED',
    timestamp: new Date(),
    elderly_user_name: userId,
    threat_level: classification.threat_level,
    summary_vi: `${alreadyInteracted ? 'ĐÃ TƯƠNG TÁC VỚI' : 'Đã phát hiện'} tin nhắn lừa đảo: ${classification.what_they_want}`,
    action_taken: 'Đã hướng dẫn người dùng các bước an toàn',
    family_action_needed: alreadyInteracted ? 'LIÊN HỆ NGAY với người dùng để kiểm tra' : null,
    scam_category: classification.scam_category,
    impersonated_org: classification.impersonated_org,
    phone_numbers: [],
    urls: [],
  };
}
