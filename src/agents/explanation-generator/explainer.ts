import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { loadConfig } from '../../tools/config';
import type { ClassificationResult, ExplanationResult } from '../../types';
import { getFamiliarComparisons } from '../educator/familiar-comparisons';
import { validateExplanation, ForbiddenPattern } from './never-shame-validator';

let _client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (_client) return _client;
  const config = loadConfig();
  if (!config.anthropic.apiKey || config.anthropic.apiKey === 'MISSING_API_KEY') return null;
  _client = new Anthropic({ apiKey: config.anthropic.apiKey });
  return _client;
}

function loadPrompt(): string {
  const candidates = [
    join(process.cwd(), 'src', 'prompts', 'elderly-explanation-prompt.md'),
    join(__dirname, '..', '..', 'prompts', 'elderly-explanation-prompt.md'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return readFileSync(p, 'utf-8');
  }
  return '';
}

function buildPrompt(classification: ClassificationResult, formOfAddress: string, region: string): string {
  const template = loadPrompt();
  const comparisons = getFamiliarComparisons();
  const comparisonForCategory =
    comparisons[classification.scam_category || 'default_danger'] || comparisons.default_danger;

  return template
    .replace('{analysis_json}', JSON.stringify(classification, null, 2))
    .replace('{form_of_address}', formOfAddress)
    .replace('{region}', region)
    .replace('{threat_level}', classification.threat_level_vi)
    .replace('{familiar_comparison}', comparisonForCategory);
}

function parseResult(raw: string): ExplanationResult {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      verdict_line: parsed.verdict_line || '',
      explanation: parsed.explanation || '',
      familiar_comparison: parsed.familiar_comparison || undefined,
      action_steps: [],
      reassurance: parsed.reassurance || '',
      educational_tip: parsed.educational_tip || undefined,
    };
  } catch {
    return {
      verdict_line: '',
      explanation: '',
      action_steps: [],
      reassurance: '',
    };
  }
}

export async function generateElderlyExplanation(
  classification: ClassificationResult,
  formOfAddress = 'ông/bà',
  region = 'north',
): Promise<ExplanationResult> {
  const client = getClient();
  const prompt = buildPrompt(classification, formOfAddress, region);

  if (!client) {
    return getStubExplanation(classification, formOfAddress);
  }

  const config = loadConfig();
  const response = await client.messages.create({
    model: config.anthropic.textModel,
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((block) => block.type === 'text')?.text || '';
  const result = parseResult(textContent);

  const validated = validateExplanation(result);
  if (validated.safe) return result;

  return {
    ...result,
    explanation: sanitizeWithForbiddenPatterns(result.explanation, validated.forbiddenFound),
  };
}

function sanitizeWithForbiddenPatterns(text: string, patterns: ForbiddenPattern[]): string {
  if (!patterns || patterns.length === 0) return text;

  const replacements: Record<string, string> = {
    phishing: 'lừa lấy thông tin',
    malware: 'virus trong điện thoại',
    URL: 'đường dẫn',
    link: 'đường dẫn',
    OTP: 'mã xác nhận một lần',
    hacker: 'kẻ gian trên mạng',
    scam: 'lừa đảo',
    spoofing: 'giả mạo',
    'social engineering': 'thủ thuật tâm lý để lừa',
    cryptocurrency: 'tiền ảo',
    'rõ ràng là': 'trông giống như',
    'ai cũng biết': 'nhiều người đã gặp',
    'tại sao ông/bà': '',
    'lần sau nhớ': 'từ giờ mình sẽ',
    'đáng lẽ ông/bà': '',
  };

  let cleaned = text;
  for (const pattern of patterns) {
    for (const [key, replacement] of Object.entries(replacements)) {
      const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      cleaned = cleaned.replace(regex, replacement);
    }
  }
  return cleaned;
}

function getStubExplanation(classification: ClassificationResult, formOfAddress: string): ExplanationResult {
  const comparisons = getFamiliarComparisons();
  const category = classification.scam_category || 'bank_phishing';

  if (classification.threat_level === 'GREEN') {
    return {
      verdict_line: `Tin nhắn này AN TOÀN, ${formOfAddress} không cần lo gì cả ạ.`,
      explanation: 'Không có dấu hiệu lừa đảo trong tin nhắn này.',
      familiar_comparison: comparisons.default_safe,
      action_steps: [],
      reassurance: `${formOfAddress} làm rất đúng khi kiểm tra trước!`,
      educational_tip: 'Mỗi lần kiểm tra là một lần ông bà giỏi hơn trong việc nhận diện lừa đảo đó ạ.',
    };
  }

  return {
    verdict_line: `Đây là tin nhắn LỪA ĐẢO đó ${formOfAddress} ạ!`,
    explanation: `Người xấu đang cố gắng ${classification.what_they_want.toLowerCase()}. ${formOfAddress} tuyệt đối không làm theo nhé.`,
    familiar_comparison: comparisons[category] || comparisons.default_danger,
    action_steps: [],
    reassurance: `${formOfAddress} hỏi trước khi bấm là rất khôn ngoan đó ạ.`,
    educational_tip: undefined,
  };
}
