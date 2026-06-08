import type { Platform } from '../../types';

interface PlatformSignal {
  platform: Platform;
  confidence: number;
  indicators: string[];
}

const PLATFORM_PATTERNS: Record<Platform, RegExp[]> = {
  sms: [/tin nhắn/i, /sms/i, /điện thoại:?\s*0/i, /(viettel|mobifone|vinaphone|vietnamobile)/i, /soạn\s/i],
  zalo: [/zalo/i, /kết bạn/i, /lời nhắn từ/i, /zalo\s*pay/i, /oa\s/i],
  facebook: [/facebook/i, /messenger/i, /bình luận/i, /trang cá nhân/i, /fb\b/i],
  email: [/@.*\./, /from:/i, /subject:/i, /to:/i, /gmail/i, /yahoo/i, /outlook/i],
  paper: [/kính gửi/i, /cộng hòa xã hội/i, /quyết định số/i, /biên bản/i, /công văn/i, /giấy/i, /mẫu số/i, /đơn/i],
  phone_call: [/cuộc gọi/i, /gọi đến/i, /số máy lẻ/i, /liên lạc qua điện thoại/i],
  unknown: [],
};

const PLATFORM_SPECIFIC_VISUAL: Record<string, Platform[]> = {
  green_bubble: ['sms'],
  blue_header: ['facebook'],
  white_input_bar: ['zalo'],
  paper_texture: ['paper'],
  email_header: ['email'],
  contact_avatar: ['zalo'],
  like_button: ['facebook'],
  sender_id_shortcode: ['sms'],
  voice_call_interface: ['phone_call'],
};

export function detectPlatform(rawText: string, visualCues: string[]): PlatformSignal {
  const scores: Map<Platform, { score: number; indicators: string[] }> = new Map();

  for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
    const indicators: string[] = [];
    let score = 0;
    for (const pattern of patterns) {
      if (pattern.test(rawText)) {
        score += 20;
        indicators.push(pattern.source);
      }
    }
    if (score > 0) scores.set(platform as Platform, { score, indicators });
  }

  for (const cue of visualCues) {
    const lowerCue = cue.toLowerCase();
    for (const [visualIndicator, platforms] of Object.entries(PLATFORM_SPECIFIC_VISUAL)) {
      if (lowerCue.includes(visualIndicator.replace(/_/g, ' ')) || lowerCue.includes(visualIndicator)) {
        for (const p of platforms) {
          const entry = scores.get(p);
          if (entry) {
            entry.score += 15;
            entry.indicators.push(`visual:${visualIndicator}`);
          } else {
            scores.set(p, { score: 15, indicators: [`visual:${visualIndicator}`] });
          }
        }
      }
    }
  }

  if (scores.size === 0) {
    return { platform: 'unknown', confidence: 0, indicators: [] };
  }

  const sorted = Array.from(scores.entries()).sort((a, b) => b[1].score - a[1].score);
  const [bestPlatform, bestData] = sorted[0];
  const maxScore = 100;
  const confidence = Math.min(bestData.score / maxScore, 1);

  return {
    platform: bestPlatform,
    confidence,
    indicators: bestData.indicators,
  };
}

export function enrichExtractionWithPlatform(
  rawText: string,
  visualCues: string[],
  currentPlatform: Platform,
): Platform {
  if (currentPlatform !== 'unknown') return currentPlatform;
  const detected = detectPlatform(rawText, visualCues);
  return detected.confidence > 0.3 ? detected.platform : 'unknown';
}
