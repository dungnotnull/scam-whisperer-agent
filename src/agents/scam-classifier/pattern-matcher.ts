import yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { ExtractionResult, FastPathResult } from '../../types';

// ─── Pattern Matcher ─────────────────────────────────────────────────────────
// Fast-path scam detection using local YAML pattern files and JSON databases.
// Runs in < 100ms with no API calls.

import { existsSync } from 'fs';

function resolveDataDir(): string {
  const candidates = [
    join(process.cwd(), 'src', 'data'),
    join(__dirname, '..', '..', 'data'),
    join(process.cwd(), 'dist', 'data'),
  ];
  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }
  return candidates[0];
}

const DATA_DIR = resolveDataDir();

interface ScamPatternEntry {
  category: string;
  phrases: string[];
  url_patterns: string[];
  weight: number;
}

interface PsychTrigger {
  tactic: string;
  phrases: string[];
  weight: number;
}

let scamPatterns: ScamPatternEntry[] | null = null;
let psychTriggers: PsychTrigger[] | null = null;
let scamPhoneDB: Set<string> | null = null;
let scamAccountDB: Set<string> | null = null;

function loadScamPatterns(): ScamPatternEntry[] {
  if (scamPatterns) return scamPatterns;
  try {
    const raw = readFileSync(join(DATA_DIR, 'scam-patterns.yaml'), 'utf-8');
    const parsed = yaml.load(raw) as { patterns: ScamPatternEntry[] };
    scamPatterns = parsed.patterns || [];
  } catch {
    console.warn('[pattern-matcher] Failed to load scam-patterns.yaml, using empty patterns');
    scamPatterns = [];
  }
  return scamPatterns;
}

function loadPsychTriggers(): PsychTrigger[] {
  if (psychTriggers) return psychTriggers;
  try {
    const raw = readFileSync(join(DATA_DIR, 'psychological-triggers.yaml'), 'utf-8');
    const parsed = yaml.load(raw) as { triggers: PsychTrigger[] };
    psychTriggers = parsed.triggers || [];
  } catch {
    psychTriggers = [];
  }
  return psychTriggers;
}

function loadScamPhoneDB(): Set<string> {
  if (scamPhoneDB) return scamPhoneDB;
  try {
    const raw = readFileSync(join(DATA_DIR, 'scam-database.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    scamPhoneDB = new Set((parsed.known_scam_phones || []).map(normalizePhone));
  } catch {
    scamPhoneDB = new Set();
  }
  return scamPhoneDB;
}

function loadScamAccountDB(): Set<string> {
  if (scamAccountDB) return scamAccountDB;
  try {
    const raw = readFileSync(join(DATA_DIR, 'scam-database.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    scamAccountDB = new Set((parsed.known_scam_accounts || []).map((a: string) => a.replace(/\s/g, '')));
  } catch {
    scamAccountDB = new Set();
  }
  return scamAccountDB;
}

// ─── Phone Normalization ─────────────────────────────────────────────────────

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s.\-()]/g, '');
  if (cleaned.startsWith('+84')) cleaned = '0' + cleaned.slice(3);
  if (cleaned.startsWith('84') && cleaned.length > 9) cleaned = '0' + cleaned.slice(2);
  return cleaned;
}

// ─── Main Matching Function ──────────────────────────────────────────────────

export function runFastPathMatching(extraction: ExtractionResult): FastPathResult {
  let suspicionScore = 0;
  const signals: string[] = [];

  const patterns = loadScamPatterns();
  const triggers = loadPsychTriggers();
  const phoneDB = loadScamPhoneDB();
  const accountDB = loadScamAccountDB();

  // 1. Check phone numbers against scam database
  for (const phone of extraction.phone_numbers) {
    const normalized = normalizePhone(phone);
    if (phoneDB.has(normalized)) {
      suspicionScore += 100;
      signals.push(`Số điện thoại ${maskPhone(phone)} đã bị báo cáo lừa đảo`);
    }
  }

  // 2. Check bank accounts against scam database
  for (const account of extraction.bank_accounts) {
    const cleaned = account.replace(/\s/g, '');
    if (accountDB.has(cleaned)) {
      suspicionScore += 100;
      signals.push(`Số tài khoản ${maskAccount(account)} đã bị báo cáo lừa đảo`);
    }
  }

  // 3. Check URLs for suspicious patterns
  for (const url of extraction.urls) {
    const urlSignals = checkUrl(url);
    suspicionScore += urlSignals.score;
    signals.push(...urlSignals.signals);
  }

  // 4. Check scam phrase patterns
  const rawText = extraction.raw_text.toLowerCase();
  for (const pattern of patterns) {
    const matchedPhrases = pattern.phrases.filter((p) => rawText.includes(p.toLowerCase()));
    if (matchedPhrases.length >= 2) {
      suspicionScore += pattern.weight || 60;
      signals.push(`Có dấu hiệu "${pattern.category}" (${matchedPhrases.length} cụm từ trùng khớp)`);
    } else if (matchedPhrases.length === 1 && pattern.weight >= 80) {
      suspicionScore += pattern.weight;
      signals.push(`Có dấu hiệu "${pattern.category}"`);
    }
  }

  // 5. Check URL patterns from YAML
  for (const pattern of patterns) {
    for (const urlPattern of pattern.url_patterns || []) {
      for (const url of extraction.urls) {
        if (matchesGlob(url, urlPattern)) {
          suspicionScore += 80;
          signals.push(`Đường dẫn ${maskUrl(url)} khớp mẫu "${urlPattern}" — thường dùng trong ${pattern.category}`);
        }
      }
    }
  }

  // 6. Check psychological manipulation tactics
  for (const trigger of triggers) {
    const matchedPhrases = trigger.phrases.filter((p) => rawText.includes(p.toLowerCase()));
    if (matchedPhrases.length >= 2) {
      suspicionScore += trigger.weight;
      signals.push(`Có dấu hiệu "${trigger.tactic}" (${matchedPhrases.length} cụm từ)`);
    }
  }

  // 7. Isolation tactic — highest priority flag (CRITICAL signal)
  const ISOLATION_PHRASES = [
    'đừng nói với ai',
    'giữ bí mật',
    'chỉ mình bạn biết',
    'đừng kể với',
    'bí mật nhé',
    'không được tiết lộ',
    'chưa thông báo với gia đình',
  ];

  for (const phrase of ISOLATION_PHRASES) {
    if (rawText.includes(phrase)) {
      suspicionScore += 150;
      signals.push('Yêu cầu giữ bí mật — đây là dấu hiệu đặc trưng của lừa đảo');
      break;
    }
  }

  // Determine if LLM analysis is needed
  // - Score 0: still run LLM for safety confirmation
  // - Score > 0 but < 100: need LLM to resolve ambiguity
  // - Score >= 100: RED already, LLM provides details
  const requiresLLMAnalysis = suspicionScore >= 0;

  return {
    suspicionScore,
    signals,
    requiresLLMAnalysis,
  };
}

// ─── URL Check Helpers ───────────────────────────────────────────────────────

function checkUrl(url: string): { score: number; signals: string[] } {
  let score = 0;
  const signals: string[] = [];

  // Suspicious TLDs
  const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.club', '.work'];
  if (suspiciousTLDs.some((tld) => url.toLowerCase().includes(tld))) {
    score += 40;
    signals.push(`Đường dẫn ${maskUrl(url)} có đuôi đáng ngờ`);
  }

  // APK download links
  if (url.toLowerCase().includes('.apk') || url.toLowerCase().includes('/apk/')) {
    score += 90;
    signals.push(`Đường dẫn ${maskUrl(url)} tải file APK — có thể là ứng dụng giả mạo`);
  }

  // URL shorteners (often used to hide real destination)
  const shorteners = ['bit.ly', 'tinyurl', 'shorturl', 'rb.gy', 'cutt.ly', 'shorte.st', 'ow.ly'];
  if (shorteners.some((s) => url.toLowerCase().includes(s))) {
    score += 50;
    signals.push(`Đường dẫn ${maskUrl(url)} là link rút gọn — không biết dẫn đến đâu`);
  }

  // Look-alike domains (e.g., vcb-secure.com impersonating vcb.com.vn)
  const impersonationPatterns = [
    { target: 'vcb', fake: ['vcb-secure', 'vcbonline', 'vietcombank-verify', 'vcb-bao-mat'] },
    { target: 'bidv', fake: ['bidv-reward', 'bidvbonus', 'bidv-km', 'bidv-bao-mat'] },
    { target: 'vneid', fake: ['vneid-update', 'vneid-moi', 'vneid-2024', 'vneid-gov'] },
  ];

  const lowerUrl = url.toLowerCase();
  for (const { fake } of impersonationPatterns) {
    if (fake.some((f) => lowerUrl.includes(f))) {
      score += 80;
      signals.push(`Đường dẫn ${maskUrl(url)} giả mạo tổ chức chính thức`);
      break;
    }
  }

  return { score, signals };
}

// ─── Simple Glob Matcher ─────────────────────────────────────────────────────

function matchesGlob(url: string, pattern: string): boolean {
  const regexStr = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  try {
    return new RegExp(regexStr, 'i').test(url);
  } catch {
    return url.toLowerCase().includes(pattern.toLowerCase());
  }
}

// ─── Masking Utilities ───────────────────────────────────────────────────────

function maskPhone(phone: string): string {
  const cleaned = phone.replace(/[\s.\-()]/g, '');
  if (cleaned.length < 7) return '***';
  return cleaned.slice(0, 3) + '***' + cleaned.slice(-3);
}

function maskAccount(account: string): string {
  const cleaned = account.replace(/\s/g, '');
  if (cleaned.length < 6) return '***';
  return '***' + cleaned.slice(-4);
}

function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}/***`;
  } catch {
    return url.slice(0, 20) + '...';
  }
}
