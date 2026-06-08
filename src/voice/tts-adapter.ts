import { TTSRequest, TTSVoiceProfile, getDefaultTTSRequest, buildSSML } from './tts-profiles';
import type { ThreatLevel } from '../types';

export interface TTSResult {
  audioBase64: string;
  format: string;
  provider: string;
  durationMs: number;
}

async function googleTTS(request: TTSRequest): Promise<TTSResult> {
  const apiKey = process.env.GOOGLE_TTS_KEY;
  if (!apiKey) throw new Error('GOOGLE_TTS_KEY not configured');

  const ssml = request.ssml ? buildSSML(request.text, request.voiceProfile, 'GREEN' as ThreatLevel) : request.text;

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: request.ssml ? { ssml } : { text: request.text },
        voice: {
          languageCode: 'vi-VN',
          name: request.voiceProfile.name,
          ssmlGender: request.voiceProfile.gender,
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: request.speakingRate,
          volumeGainDb: request.volumeGainDb,
          effectsProfileId: ['headphone-class-device'],
        },
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google TTS error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as { audioContent?: string };
  return {
    audioBase64: data.audioContent || '',
    format: 'mp3',
    provider: 'google',
    durationMs: 0,
  };
}

async function fptTTS(request: TTSRequest): Promise<TTSResult> {
  const apiKey = process.env.FPT_AI_TTS_KEY;
  if (!apiKey) throw new Error('FPT_AI_TTS_KEY not configured');

  const response = await fetch('https://api.fpt.ai/hmi/tts/v5', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ text: request.text, voice: request.voiceProfile.name, speed: String(request.speakingRate) }).toString(),
  });

  if (!response.ok) throw new Error(`FPT TTS error ${response.status}`);

  const data = (await response.json()) as { async?: string; error?: number; message?: string };
  if (data.error !== 0) throw new Error(`FPT TTS: ${data.message}`);

  return {
    audioBase64: data.async || '',
    format: 'mp3',
    provider: 'fpt_ai',
    durationMs: 0,
  };
}

async function coquiTTS(request: TTSRequest): Promise<TTSResult> {
  const response = await fetch('http://localhost:5002/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: request.text, speaker_name: request.voiceProfile.name }),
  });

  if (!response.ok) throw new Error(`Coqui TTS error ${response.status}`);
  const data = (await response.json()) as { wav_base64?: string };
  return {
    audioBase64: data.wav_base64 || '',
    format: 'wav',
    provider: 'coqui',
    durationMs: 0,
  };
}

export async function synthesizeSpeech(request: TTSRequest): Promise<TTSResult> {
  const providers: Array<{ name: string; fn: (r: TTSRequest) => Promise<TTSResult> }> = [];

  switch (request.voiceProfile.provider) {
    case 'google':
      providers.push({ name: 'google', fn: googleTTS });
      providers.push({ name: 'fpt_ai', fn: fptTTS });
      break;
    case 'fpt_ai':
      providers.push({ name: 'fpt_ai', fn: fptTTS });
      providers.push({ name: 'google', fn: googleTTS });
      break;
    case 'coqui':
      providers.push({ name: 'coqui', fn: coquiTTS });
      providers.push({ name: 'google', fn: googleTTS });
      break;
  }

  for (const provider of providers) {
    try {
      return await provider.fn(request);
    } catch (err) {
      console.warn(`[tts] ${provider.name} failed:`, err instanceof Error ? err.message : String(err));
    }
  }

  throw new Error('All TTS providers failed');
}

export async function synthesizeVoiceResponse(
  text: string,
  voicePreset: string,
  threatLevel: ThreatLevel,
): Promise<TTSResult | null> {
  if (!text) return null;

  try {
    const request = getDefaultTTSRequest(text, voicePreset, threatLevel);
    return await synthesizeSpeech(request);
  } catch (err) {
    console.error('[tts] Voice synthesis failed:', err instanceof Error ? err.message : String(err));
    return null;
  }
}
