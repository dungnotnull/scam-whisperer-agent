import type { ExplanationResult } from '../../types';

export interface ForbiddenPattern {
  type: 'TECHNICAL_TERM' | 'SHAMING' | 'CONDESCENDING';
  pattern: string;
  found: string;
}

const TECHNICAL_TERMS: string[] = [
  'phishing',
  'malware',
  'spoofing',
  'social engineering',
  'URL',
  'link',
  'OTP',
  'hacker',
  'spam',
  'bot',
  'trojan',
  'ransomware',
  'keylogger',
  'man-in-the-middle',
];

const SHAMING_PATTERNS: string[] = [
  'rõ ràng là',
  'ai cũng biết',
  'tại sao ông',
  'tại sao bà',
  'đáng lẽ',
  'lẽ ra',
  'không nên bao giờ',
  'đã bảo rồi',
  'lần sau nhớ',
  'cẩn thận hơn',
  'sao ông lại',
  'sao bà lại',
];

const CONDESCENDING_PATTERNS: string[] = [
  'rất cũ',
  'ai cũng biết rồi',
  'dễ quá mà',
  'đơn giản thôi',
  'chỉ là',
  'thế mà cũng',
  'có thế thôi',
];

export function validateExplanation(result: ExplanationResult): {
  safe: boolean;
  forbiddenFound: ForbiddenPattern[];
  warnings: string[];
} {
  const forbiddenFound: ForbiddenPattern[] = [];
  const warnings: string[] = [];
  const textToCheck = `${result.verdict_line} ${result.explanation} ${result.reassurance}`.toLowerCase();

  for (const term of TECHNICAL_TERMS) {
    const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    const match = textToCheck.match(regex);
    if (match) {
      forbiddenFound.push({ type: 'TECHNICAL_TERM', pattern: term, found: match[0] });
    }
  }

  for (const pattern of SHAMING_PATTERNS) {
    if (textToCheck.includes(pattern)) {
      forbiddenFound.push({ type: 'SHAMING', pattern, found: pattern });
    }
  }

  for (const pattern of CONDESCENDING_PATTERNS) {
    if (textToCheck.includes(pattern)) {
      forbiddenFound.push({ type: 'CONDESCENDING', pattern, found: pattern });
    }
  }

  const sentenceCount = (result.explanation.match(/[.!?]+/g) || []).length;
  if (sentenceCount > 4) {
    warnings.push(`Explanation has ${sentenceCount} sentences. Target is 2-3 max for elderly comprehension.`);
  }

  const wordCount = textToCheck.split(/\s+/).length;
  if (wordCount > 150) {
    warnings.push(`Total word count is ${wordCount}. Target is < 150 words for elderly users.`);
  }

  return {
    safe: forbiddenFound.length === 0,
    forbiddenFound,
    warnings,
  };
}

export const REGIONAL_VOCABULARY: Record<string, Record<string, string>> = {
  north: {
    yes: 'vâng',
    no: 'không',
    very: 'rất',
    'don\'t': 'không',
    please: 'xin',
  },
  south: {
    yes: 'dạ',
    no: 'hổng',
    very: 'lắm',
    'don\'t': 'đừng',
    please: 'làm ơn',
  },
  central: {
    yes: 'dạ',
    no: 'không',
    very: 'rất',
    'don\'t': 'đừng',
    please: 'xin',
  },
};

const ADAPTATIONS = {
  north: {
    defaultAddress: 'ông/bà',
    'good': 'tốt',
    'bad': 'xấu',
    'dangerous': 'nguy hiểm',
    'hello': 'chào',
    'pleaseCalm': 'bình tĩnh',
  },
  south: {
    defaultAddress: 'ông/bà',
    'good': 'tốt',
    'bad': 'xấu',
    'dangerous': 'nguy hiểm',
    'hello': 'chào',
    'pleaseCalm': 'bình tĩnh',
  },
  central: {
    defaultAddress: 'ông/bà',
    'good': 'tốt',
    'bad': 'xấu',
    'dangerous': 'nguy hiểm',
    'hello': 'chào',
    'pleaseCalm': 'bình tĩnh',
  },
};

export function adaptExplanationForRegion(
  text: string,
  region: string,
  formOfAddress: string,
): string {
  const adaptations = ADAPTATIONS[region as keyof typeof ADAPTATIONS] || ADAPTATIONS.north;

  let adapted = text;
  for (const [key, value] of Object.entries(adaptations)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    adapted = adapted.replace(regex, value);
  }

  adapted = adapted.replace(/\{form_of_address\}/g, formOfAddress);
  adapted = adapted.replace(/\{ông\/bà\}/g, formOfAddress);

  return adapted;
}
