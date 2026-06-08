import type { ThreatLevel } from '../types';

export interface TTSVoiceProfile {
  provider: 'google' | 'fpt_ai' | 'coqui';
  name: string;
  gender: 'MALE' | 'FEMALE';
  accent: 'north' | 'south' | 'central';
}

export interface TTSRequest {
  text: string;
  voiceProfile: TTSVoiceProfile;
  speakingRate: number;
  volumeGainDb: number;
  ssml?: boolean;
}

export const VOICE_PRESETS: Record<string, TTSVoiceProfile> = {
  north_female: { provider: 'google', name: 'vi-VN-Wavenet-A', gender: 'FEMALE', accent: 'north' },
  north_male: { provider: 'google', name: 'vi-VN-Wavenet-B', gender: 'MALE', accent: 'north' },
  south_female: { provider: 'google', name: 'vi-VN-Wavenet-C', gender: 'FEMALE', accent: 'south' },
  south_male: { provider: 'google', name: 'vi-VN-Wavenet-D', gender: 'MALE', accent: 'south' },
  fpt_south_female: { provider: 'fpt_ai', name: 'banmai', gender: 'FEMALE', accent: 'south' },
  fpt_north_female: { provider: 'fpt_ai', name: 'lannhi', gender: 'FEMALE', accent: 'north' },
  fpt_south_male: { provider: 'fpt_ai', name: 'leminh', gender: 'MALE', accent: 'south' },
  coqui_fallback: { provider: 'coqui', name: 'vi-female', gender: 'FEMALE', accent: 'north' },
};

const ELDERLY_DEFAULTS = {
  speakingRate: 0.85,
  volumeGainDb: 2.0,
};

export function buildSSML(text: string, voiceProfile: TTSVoiceProfile, threatLevel: ThreatLevel): string {
  const rate = ELDERLY_DEFAULTS.speakingRate;
  const pauseBetweenSentences = 300;
  const pauseBetweenSteps = 500;

  const ssmlParts: string[] = [
    '<?xml version="1.0"?>',
    '<speak>',
  ];

  if (threatLevel === 'RED') {
    ssmlParts.push('<prosody rate="slow" volume="loud">');
    ssmlParts.push('<emphasis level="strong">');
    ssmlParts.push(escapeXml(text.split('.')[0] || text));
    ssmlParts.push('</emphasis>');
    ssmlParts.push(`<break time="${pauseBetweenSentences}ms"/>`);
    const rest = text.split('.').slice(1).join('.');
    if (rest) {
      ssmlParts.push(rest);
    }
    ssmlParts.push('</prosody>');
  } else if (threatLevel === 'ORANGE') {
    ssmlParts.push('<prosody rate="slow">');
    ssmlParts.push(text);
    ssmlParts.push('</prosody>');
  } else {
    ssmlParts.push(`<prosody rate="${rate}">`);
    const sentences = text.split(/(?<=[.!?])\s+/);
    for (let i = 0; i < sentences.length; i++) {
      const s = sentences[i].trim();
      if (!s) continue;
      const isStep = /^bước\s+\d/i.test(s);
      ssmlParts.push(escapeXml(s));
      if (isStep && i < sentences.length - 1) {
        ssmlParts.push(`<break time="${pauseBetweenSteps}ms"/>`);
      } else if (i < sentences.length - 1) {
        ssmlParts.push(`<break time="${pauseBetweenSentences}ms"/>`);
      }
    }
    ssmlParts.push('</prosody>');
  }

  ssmlParts.push('</speak>');
  return ssmlParts.join('\n');
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function preprocessNumberForTTS(text: string): string {
  return text.replace(/(\d{1,3})([,.]\d{3})*(\.\d+)?\s*(triệu|tr|nghìn|tỷ|đồng|vnd|vnđ)?/gi, (match) => {
    const cleaned = match.replace(/[,.]/g, '').replace(/[^0-9]/g, ' ').trim();
    const num = parseInt(cleaned, 10);
    if (isNaN(num)) return match;
    if (num >= 1_000_000_000) {
      const billions = Math.floor(num / 1_000_000_000);
      const millions = Math.floor((num % 1_000_000_000) / 1_000_000);
      return millions > 0 ? `${billions} tỷ ${millions} triệu` : `${billions} tỷ`;
    }
    if (num >= 1_000_000) {
      const millions = Math.floor(num / 1_000_000);
      const thousands = Math.floor((num % 1_000_000) / 1_000);
      return thousands > 0 ? `${millions} triệu ${thousands} nghìn` : `${millions} triệu`;
    }
    return match;
  });
}

export function getVoicePreset(presetKey: string): TTSVoiceProfile {
  return VOICE_PRESETS[presetKey] || VOICE_PRESETS.north_female;
}

export function getDefaultTTSRequest(text: string, voicePreset: string, threatLevel: ThreatLevel): TTSRequest {
  const profile = getVoicePreset(voicePreset);
  return {
    text: preprocessNumberForTTS(text),
    voiceProfile: profile,
    speakingRate: ELDERLY_DEFAULTS.speakingRate,
    volumeGainDb: ELDERLY_DEFAULTS.volumeGainDb,
    ssml: true,
  };
}
