import { z } from 'zod';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const ThreatLevel = {
  RED: 'RED',
  ORANGE: 'ORANGE',
  YELLOW: 'YELLOW',
  GREEN: 'GREEN',
} as const;
export type ThreatLevel = (typeof ThreatLevel)[keyof typeof ThreatLevel];

export const ThreatLevelVi: Record<ThreatLevel, string> = {
  RED: 'NGUY HIỂM',
  ORANGE: 'ĐÁ NGỜ',
  YELLOW: 'CHÚ Ý',
  GREEN: 'AN TOÀN',
};

export type Platform = 'sms' | 'zalo' | 'facebook' | 'email' | 'paper' | 'phone_call' | 'unknown';
export type AskingFor = 'money' | 'personal_info' | 'password' | 'click_link' | 'install_app' | 'otp' | 'none';
export type ImageQuality = 'good' | 'fair' | 'poor';
export type ScamCategory =
  | 'prize_lottery'
  | 'bank_account_freeze'
  | 'bank_password_phishing'
  | 'cccd_update'
  | 'tax_fine'
  | 'social_insurance'
  | 'grandchild_emergency'
  | 'romance_scam'
  | 'malicious_apk'
  | 'qr_code_scam'
  | 'spam_advertising'
  | 'legitimate'
  | 'unknown';

export type AlertType =
  | 'SCAM_DETECTED'
  | 'SCAM_INTERACTED'
  | 'POSSIBLE_LOSS'
  | 'WEEKLY_DIGEST'
  | 'EDUCATIONAL_MILESTONE';

// ─── Core Data Interfaces ────────────────────────────────────────────────────

export interface ExtractionResult {
  raw_text: string;
  platform: Platform;
  phone_numbers: string[];
  urls: string[];
  bank_accounts: string[];
  qr_code_detected: boolean;
  qr_code_content?: string;
  impersonated_org?: string;
  logos_detected: string[];
  urgency_visual_cues: string[];
  asking_for: AskingFor[];
  psychological_tactics: string[];
  image_quality: ImageQuality;
  language: 'vi' | 'en' | 'mixed';
}

export interface FastPathResult {
  suspicionScore: number;
  signals: string[];
  requiresLLMAnalysis: boolean;
}

export interface ClassificationResult {
  threat_level: ThreatLevel;
  threat_level_vi: string;
  scam_category?: ScamCategory;
  confidence: number;
  evidence: string[];
  impersonated_org?: string;
  psychological_tactics: string[];
  what_they_want: string;
  technical_summary: string;
}

export interface ExplanationResult {
  verdict_line: string;
  explanation: string;
  familiar_comparison?: string;
  action_steps: string[];
  reassurance: string;
  educational_tip?: string;
}

export interface FamilyAlert {
  type: AlertType;
  timestamp: Date;
  elderly_user_name: string;
  threat_level: ThreatLevel;
  summary_vi: string;
  action_taken: string;
  family_action_needed: string | null;
  scam_category?: string;
  impersonated_org?: string;
  phone_numbers: string[];
  urls: string[];
  image_thumbnail?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  formOfAddress: 'ông' | 'bà' | 'thầy' | 'cô' | 'bác' | 'cụ';
  region: 'north' | 'south' | 'central';
  voicePreference: 'north_female' | 'north_male' | 'south_female' | 'south_male';
  primaryGuardianId: string;
  fontSize: number;
  lessonsLearned: string[];
}

export interface Guardian {
  id: string;
  name: string;
  phone: string;
  role: 'PRIMARY' | 'SECONDARY';
  notification_preferences: {
    red_alerts: boolean;
    orange_alerts: boolean;
    weekly_digest: boolean;
    channel: 'zalo' | 'sms' | 'push' | 'email';
  };
}

export interface AnalyzeRequest {
  image_base64: string;
  user_id: string;
  media_type?: string;
  follow_up_context?: string;
}

export interface AnalyzeResponse {
  request_id: string;
  classification: ClassificationResult;
  explanation: ExplanationResult;
  voice_url?: string;
  family_alert?: FamilyAlert;
  processing_time_ms: number;
}

// ─── Zod Schemas for API Validation ──────────────────────────────────────────

export const AnalyzeRequestSchema = z.object({
  image_base64: z.string().min(1),
  user_id: z.string().min(1),
  media_type: z.string().optional().default('image/jpeg'),
  follow_up_context: z.string().optional(),
});

export const ExtractionResultSchema = z.object({
  raw_text: z.string(),
  platform: z.enum(['sms', 'zalo', 'facebook', 'email', 'paper', 'phone_call', 'unknown']),
  phone_numbers: z.array(z.string()),
  urls: z.array(z.string()),
  bank_accounts: z.array(z.string()),
  qr_code_detected: z.boolean(),
  qr_code_content: z.string().optional(),
  impersonated_org: z.string().optional(),
  logos_detected: z.array(z.string()),
  urgency_visual_cues: z.array(z.string()),
  asking_for: z.array(
    z.enum(['money', 'personal_info', 'password', 'click_link', 'install_app', 'otp', 'none']),
  ),
  psychological_tactics: z.array(z.string()),
  image_quality: z.enum(['good', 'fair', 'poor']),
  language: z.enum(['vi', 'en', 'mixed']),
});

// ─── Configuration ───────────────────────────────────────────────────────────

export interface AppConfig {
  anthropic: {
    apiKey: string;
    visionModel: string;
    textModel: string;
  };
  server: {
    port: number;
    nodeEnv: string;
  };
  redis: {
    url: string;
  };
}
