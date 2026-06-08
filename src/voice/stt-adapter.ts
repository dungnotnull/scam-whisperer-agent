import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, createWriteStream } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

export interface STTResult {
  text: string;
  confidence: number;
  language: string;
  segments: Array<{ text: string; start: number; end: number }>;
}

const WAKE_WORDS = [
  'cháu ơi',
  'cháu ới',
  'cháu ôi',
  'cháu oi',
];

const VOICE_COMMANDS: Record<string, string> = {
  'cái này là gì': 'analyze_current',
  'đây có lừa đảo không': 'analyze_current',
  'kiểm tra cái này': 'analyze_current',
  'gọi cho con': 'call_primary_guardian',
  'gọi cho người thân': 'call_primary_guardian',
  'lặp lại': 'repeat',
  'nói lại': 'repeat',
  'nói chậm hơn': 'repeat_slower',
  'nói to hơn': 'repeat_louder',
  'xóa đi': 'delete_message',
  'hết rồi': 'dismiss',
  'cảm ơn cháu': 'dismiss',
};

export function detectWakeWord(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return WAKE_WORDS.some((w) => lower.includes(w));
}

export function detectVoiceCommand(text: string): { command: string; args: string } | null {
  const lower = text.toLowerCase().trim();
  for (const [phrase, command] of Object.entries(VOICE_COMMANDS)) {
    if (lower.includes(phrase)) {
      return { command, args: lower.replace(phrase, '').trim() };
    }
  }
  return null;
}

export function detectEmergencyFromVoice(text: string): boolean {
  const emergencyTriggers = [
    'bấm vào rồi',
    'đã bấm',
    'đã chuyển tiền',
    'đã gửi',
    'mất tiền',
    'bị lừa',
    'đã nhập',
    'đã cài',
    'tải về rồi',
  ];
  const lower = text.toLowerCase();
  return emergencyTriggers.some((t) => lower.includes(t));
}

export function checkHasScreenshotQuery(text: string): boolean {
  const queries = [
    'cái này',
    'đây',
    'xem',
    'kiểm tra',
    'coi',
    'nhìn',
    'có sao không',
    'có nguy hiểm không',
    'có phải',
  ];
  const lower = text.toLowerCase();
  return queries.some((q) => lower.includes(q));
}

export async function transcribeWhisper(audioBase64: string): Promise<STTResult> {
  const tmpFile = join(tmpdir(), `stt-${randomUUID()}.wav`);
  mkdirSync(dirname(tmpFile), { recursive: true });

  try {
    const buffer = Buffer.from(audioBase64, 'base64');
    createWriteStream(tmpFile).end(buffer);

    return new Promise((resolve, reject) => {
      const child = spawn('python3', ['-c', `
import sys, json, base64
try:
    import whisper
    model = whisper.load_model("base")
    result = model.transcribe("${tmpFile.replace(/\\/g, '\\\\')}", language="vi")
    print(json.dumps({"text": result["text"], "confidence": 0.9, "language": "vi", "segments": []}))
except ImportError:
    print(json.dumps({"error": "whisper not installed. Run: pip install openai-whisper"}))
    sys.exit(1)
`]);

      let stdout = '';
      child.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
      child.on('close', (code) => {
        try { require('fs').unlinkSync(tmpFile); } catch {}
        if (code !== 0) {
          resolve({ text: '', confidence: 0, language: 'vi', segments: [] });
          return;
        }
        try {
          const parsed = JSON.parse(stdout);
          if (parsed.error) reject(new Error(parsed.error));
          else resolve(parsed as STTResult);
        } catch { reject(new Error('Failed to parse Whisper output')); }
      });
    });
  } catch {
    return { text: '', confidence: 0, language: 'vi', segments: [] };
  }
}
