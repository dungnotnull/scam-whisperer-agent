import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { loadConfig } from '../../tools/config';
import type { ClassificationResult, ExtractionResult } from '../../types';

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
    join(process.cwd(), 'src', 'prompts', 'classification-prompt.md'),
    join(__dirname, '..', '..', 'prompts', 'classification-prompt.md'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return readFileSync(p, 'utf-8');
  }
  return '';
}

function resolveKnowledgeDir(): string {
  const candidates = [join(process.cwd(), 'src', 'data'), join(__dirname, '..', '..', 'data')];
  for (const d of candidates) {
    if (existsSync(d)) return d;
  }
  return candidates[0];
}

function loadKnowledgeEntries(): { category: string; phrases: string[]; weight: number }[] {
  try {
    const yaml = require('js-yaml');
    const dataDir = resolveKnowledgeDir();
    const raw = readFileSync(join(dataDir, 'scam-patterns.yaml'), 'utf-8');
    const parsed = yaml.load(raw) as { patterns?: { category: string; phrases: string[]; weight: number }[] };
    return parsed?.patterns || [];
  } catch {
    return [];
  }
}

function buildKnowledgeContext(extraction: ExtractionResult): string {
  const entries = loadKnowledgeEntries();
  const text = extraction.raw_text.toLowerCase();
  const relevant = entries.filter(
    (e) => e.phrases?.some((p) => text.includes(p.toLowerCase())),
  );
  if (relevant.length === 0) {
    const top5 = entries.slice(0, 5);
    return top5.map((e) => `- ${e.category}: ${e.phrases.slice(0, 3).join(', ')}`).join('\n');
  }
  return relevant
    .slice(0, 8)
    .map((e) => `- ${e.category} (weight:${e.weight}): matched ${e.phrases.filter((p) => text.includes(p.toLowerCase())).length} phrases`)
    .join('\n');
}

function buildPrompt(extraction: ExtractionResult, fastPathSignals: string[], knowledgeContext: string): string {
  const template = loadPrompt();
  return template
    .replace('{extraction_json}', JSON.stringify(extraction, null, 2))
    .replace('{fast_path_signals}', fastPathSignals.length > 0 ? fastPathSignals.map((s) => `- ${s}`).join('\n') : 'No fast-path signals detected')
    .replace('{knowledge_context}', knowledgeContext || 'No relevant knowledge base entries found');
}

function parseResult(raw: string): ClassificationResult {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      threat_level: parsed.threat_level || 'GREEN',
      threat_level_vi: parsed.threat_level_vi || 'AN TOÀN',
      scam_category: parsed.scam_category || 'legitimate',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
      impersonated_org: parsed.impersonated_org || undefined,
      psychological_tactics: Array.isArray(parsed.psychological_tactics) ? parsed.psychological_tactics : [],
      what_they_want: parsed.what_they_want || 'Không xác định được',
      technical_summary: parsed.technical_summary || 'No classification available',
    };
  } catch {
    return {
      threat_level: 'GREEN',
      threat_level_vi: 'AN TOÀN',
      scam_category: 'legitimate',
      confidence: 0.3,
      evidence: [],
      psychological_tactics: [],
      what_they_want: 'Không xác định được',
      technical_summary: 'Classification failed',
    };
  }
}

export async function deepClassify(
  extraction: ExtractionResult,
  fastPathSignals: string[],
): Promise<ClassificationResult> {
  const client = getClient();
  const knowledgeContext = buildKnowledgeContext(extraction);
  const prompt = buildPrompt(extraction, fastPathSignals, knowledgeContext);

  if (!client) {
    return {
      threat_level: 'GREEN',
      threat_level_vi: 'AN TOÀN',
      scam_category: 'legitimate',
      confidence: 0.5,
      evidence: ['[STUB] Configure ANTHROPIC_API_KEY for real classification.'],
      psychological_tactics: [],
      what_they_want: 'Không có gì đáng ngờ',
      technical_summary: 'Configure ANTHROPIC_API_KEY for real classification.',
    };
  }

  const config = loadConfig();
  const response = await client.messages.create({
    model: config.anthropic.textModel,
    max_tokens: 800,
    temperature: 0.1,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((block) => block.type === 'text')?.text || '';
  return parseResult(textContent);
}

export function applyConsensusLogic(
  llmResult: ClassificationResult,
  fastPathScore: number,
  urlCheckResult: { maliciousUrls: string[] } | null,
  phoneCheckResult: { knownScamPhones: string[] } | null,
): ClassificationResult {
  const evidence = [...llmResult.evidence];
  let threatLevel = llmResult.threat_level;

  if (fastPathScore >= 150) {
    threatLevel = 'RED';
    evidence.push('Fast-path pattern matcher score >= 150 — overriding to RED');
  }

  if (urlCheckResult && urlCheckResult.maliciousUrls.length > 0) {
    threatLevel = 'RED';
    evidence.push(`URLs flagged as malicious by Safe Browsing: ${urlCheckResult.maliciousUrls.join(', ')}`);
  }

  if (phoneCheckResult && phoneCheckResult.knownScamPhones.length > 0) {
    threatLevel = 'RED';
    evidence.push(`Phone numbers in scam database: ${phoneCheckResult.knownScamPhones.join(', ')}`);
  }

  if (threatLevel === llmResult.threat_level) {
    return llmResult;
  }

  return {
    ...llmResult,
    threat_level: threatLevel,
    threat_level_vi: threatLevel === 'RED' ? 'NGUY HIỂM' : llmResult.threat_level_vi,
    evidence,
  };
}
