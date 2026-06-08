import Anthropic from '@anthropic-ai/sdk';
import { loadConfig } from './config';
import type { ExtractionResult, ClassificationResult, ExplanationResult } from '../types';

// ─── LLM Client ──────────────────────────────────────────────────────────────
// Wraps Anthropic API for Vision analysis, scam classification, and explanation generation.
// Includes retry, cost tracking, and graceful error handling.
// In Phase 0, this is a stub that returns placeholder data when no API key is set.

interface CallMetrics {
  model: string;
  tokens_in: number;
  tokens_out: number;
  latency_ms: number;
  cost_usd: number;
}

interface CostTracker {
  total_cost_usd: number;
  total_calls: number;
  calls: CallMetrics[];
}

const PRICING_PER_1K_TOKENS: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
};

let costTracker: CostTracker = {
  total_cost_usd: 0,
  total_calls: 0,
  calls: [],
};

export function getCostTracker(): Readonly<CostTracker> {
  return costTracker;
}

export function resetCostTracker(): void {
  costTracker = { total_cost_usd: 0, total_calls: 0, calls: [] };
}

function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  const pricing = PRICING_PER_1K_TOKENS[model];
  if (!pricing) return 0;
  return (pricing.input * tokensIn + pricing.output * tokensOut) / 1000;
}

function recordMetrics(metrics: CallMetrics): void {
  costTracker.total_cost_usd += metrics.cost_usd;
  costTracker.total_calls += 1;
  costTracker.calls.push(metrics);
}

// ─── Client Initialization ───────────────────────────────────────────────────

function createClient(): Anthropic | null {
  const config = loadConfig();
  if (!config.anthropic.apiKey || config.anthropic.apiKey === 'MISSING_API_KEY') {
    return null;
  }
  return new Anthropic({ apiKey: config.anthropic.apiKey });
}

// ─── Resilient Call Wrapper ──────────────────────────────────────────────────

async function callWithRetry<T>(
  model: string,
  makeRequest: (client: Anthropic) => Promise<{ result: T; tokensIn: number; tokensOut: number }>,
  maxRetries = 3,
): Promise<{ result: T; metrics: CallMetrics }> {
  const client = createClient();

  if (!client) {
    throw new NoApiKeyError('ANTHROPIC_API_KEY is not configured. Set it in .env');
  }

  let lastError: Error | null = null;
  const startTime = Date.now();

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { result, tokensIn, tokensOut } = await makeRequest(client);
      const latencyMs = Date.now() - startTime;
      const costUsd = estimateCost(model, tokensIn, tokensOut);

      const metrics: CallMetrics = {
        model,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        latency_ms: latencyMs,
        cost_usd: costUsd,
      };

      recordMetrics(metrics);
      return { result, metrics };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on auth or overload errors
      if (error instanceof Anthropic.AuthenticationError) {
        throw new ApiAuthError(lastError.message);
      }
      if (error instanceof Anthropic.RateLimitError) {
        const delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.warn(`Rate limited, retrying in ${delayMs}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delayMs);
        continue;
      }
      if (attempt < maxRetries - 1) {
        const delayMs = Math.pow(2, attempt) * 500;
        console.warn(`API error, retrying in ${delayMs}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delayMs);
        continue;
      }
    }
  }

  throw new ApiRetryExhaustedError(`All ${maxRetries} attempts failed. Last error: ${lastError?.message}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Custom Errors ──────────────────────────────────────────────────────────

export class NoApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoApiKeyError';
  }
}

export class ApiAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiAuthError';
  }
}

export class ApiRetryExhaustedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiRetryExhaustedError';
  }
}

// ─── Vision Analysis ─────────────────────────────────────────────────────────
// In Phase 0: returns a stub. In production: calls Claude Vision API.

export async function analyzeImage(
  imageBase64: string,
  _mediaType = 'image/jpeg',
): Promise<{ result: ExtractionResult; metrics: CallMetrics }> {
  const config = loadConfig();
  const client = createClient();

  if (!client) {
    // Phase 0 stub — return placeholder data when no API key
    console.warn('[llm-client] No API key — returning stub ExtractionResult');
    return {
      result: getStubExtractionResult(),
      metrics: { model: 'stub', tokens_in: 0, tokens_out: 0, latency_ms: 0, cost_usd: 0 },
    };
  }

  return callWithRetry<ExtractionResult>(config.anthropic.visionModel, async (c) => {
    const response = await c.messages.create({
      model: config.anthropic.visionModel,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg' as const, data: imageBase64 },
            },
            {
              type: 'text',
              text: 'Extract all text and visual elements from this screenshot. Output as structured JSON.',
            },
          ],
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === 'text')?.text || '{}';
    return {
      result: parseExtractionJSON(textContent),
      tokensIn: response.usage?.input_tokens || 0,
      tokensOut: response.usage?.output_tokens || 0,
    };
  });
}

// ─── Scam Classification ─────────────────────────────────────────────────────

export async function classifyScam(
  _extraction: ExtractionResult,
  _fastPathSignals: string[],
): Promise<{ result: ClassificationResult; metrics: CallMetrics }> {
  const config = loadConfig();
  const client = createClient();

  if (!client) {
    console.warn('[llm-client] No API key — returning stub ClassificationResult');
    return {
      result: getStubClassificationResult(),
      metrics: { model: 'stub', tokens_in: 0, tokens_out: 0, latency_ms: 0, cost_usd: 0 },
    };
  }

  return callWithRetry<ClassificationResult>(config.anthropic.textModel, async (c) => {
    const response = await c.messages.create({
      model: config.anthropic.textModel,
      max_tokens: 600,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: 'Classify this scam content. Output as structured JSON.',
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === 'text')?.text || '{}';
    return {
      result: parseClassificationJSON(textContent),
      tokensIn: response.usage?.input_tokens || 0,
      tokensOut: response.usage?.output_tokens || 0,
    };
  });
}

// ─── Explanation Generation ─────────────────────────────────────────────────

export async function generateExplanation(
  _classification: ClassificationResult,
): Promise<{ result: ExplanationResult; metrics: CallMetrics }> {
  const config = loadConfig();
  const client = createClient();

  if (!client) {
    console.warn('[llm-client] No API key — returning stub ExplanationResult');
    return {
      result: getStubExplanationResult(),
      metrics: { model: 'stub', tokens_in: 0, tokens_out: 0, latency_ms: 0, cost_usd: 0 },
    };
  }

  return callWithRetry<ExplanationResult>(config.anthropic.textModel, async (c) => {
    const response = await c.messages.create({
      model: config.anthropic.textModel,
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: 'Generate a plain-language Vietnamese explanation for this scam classification.',
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === 'text')?.text || '{}';
    return {
      result: parseExplanationJSON(textContent),
      tokensIn: response.usage?.input_tokens || 0,
      tokensOut: response.usage?.output_tokens || 0,
    };
  });
}

// ─── JSON Parsers (robust against malformed LLM output) ─────────────────────

function parseExtractionJSON(raw: string): ExtractionResult {
  try {
    const parsed = JSON.parse(raw);
    return {
      raw_text: parsed.raw_text || '',
      platform: parsed.platform || 'unknown',
      phone_numbers: parsed.phone_numbers || [],
      urls: parsed.urls || [],
      bank_accounts: parsed.bank_accounts || [],
      qr_code_detected: parsed.qr_code_detected || false,
      qr_code_content: parsed.qr_code_content,
      impersonated_org: parsed.impersonated_org,
      logos_detected: parsed.logos_detected || [],
      urgency_visual_cues: parsed.urgency_visual_cues || [],
      asking_for: parsed.asking_for || [],
      psychological_tactics: parsed.psychological_tactics || [],
      image_quality: parsed.image_quality || 'fair',
      language: parsed.language || 'vi',
    };
  } catch {
    console.warn('[llm-client] Failed to parse Extraction JSON, returning empty result');
    return getStubExtractionResult();
  }
}

function parseClassificationJSON(raw: string): ClassificationResult {
  try {
    return JSON.parse(raw);
  } catch {
    return getStubClassificationResult();
  }
}

function parseExplanationJSON(raw: string): ExplanationResult {
  try {
    return JSON.parse(raw);
  } catch {
    return getStubExplanationResult();
  }
}

// ─── Stub Data (Phase 0 placeholders) ───────────────────────────────────────

function getStubExtractionResult(): ExtractionResult {
  return {
    raw_text: '[STUB] No real analysis performed — ANTHROPIC_API_KEY not configured',
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
}

function getStubClassificationResult(): ClassificationResult {
  return {
    threat_level: 'GREEN',
    threat_level_vi: 'AN TOÀN',
    scam_category: 'legitimate',
    confidence: 0.5,
    evidence: ['[STUB] No real classification — ANTHROPIC_API_KEY not configured'],
    psychological_tactics: [],
    what_they_want: 'Không có gì đáng ngờ',
    technical_summary: '[STUB] Configure ANTHROPIC_API_KEY to enable real classification.',
  };
}

function getStubExplanationResult(): ExplanationResult {
  return {
    verdict_line: 'Ông/bà ơi, cháu chưa kiểm tra được tin nhắn này ạ.',
    explanation:
      'Ứng dụng đang ở chế độ phát triển. Khi có API key, cháu sẽ phân tích tin nhắn giúp ông/bà ngay.',
    action_steps: [
      'Bước 1: Khoan bấm vào gì trong tin nhắn đó',
      'Bước 2: Gọi cho người thân nếu ông/bà thấy lo',
      'Bước 3: Chờ cháu cập nhật ứng dụng nhé',
    ],
    reassurance: 'Ông bà đừng lo, cháu sẽ sớm sẵn sàng bảo vệ ông bà ạ.',
  };
}
