import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface KnowledgeEntry {
  id: string;
  excerpt: string;
  phrases: string[];
  category: string;
  weight: number;
}

interface ScoredEntry extends KnowledgeEntry {
  score: number;
}

let _entries: KnowledgeEntry[] | null = null;

function loadEntries(): KnowledgeEntry[] {
  if (_entries) return _entries;
  try {
    const candidates = [
      join(process.cwd(), 'src', 'data', 'scam-patterns.yaml'),
      join(__dirname, '..', '..', 'data', 'scam-patterns.yaml'),
    ];
    for (const p of candidates) {
      if (existsSync(p)) {
        const yaml = require('js-yaml');
        const raw = readFileSync(p, 'utf-8');
        const parsed = yaml.load(raw) as { patterns?: { category: string; phrases: string[]; weight: number }[] };
        _entries = (parsed.patterns || []).map((pat, idx) => ({
          id: `KB-${pat.category}-${idx}`,
          excerpt: pat.phrases.slice(0, 3).join(', '),
          phrases: pat.phrases,
          category: pat.category,
          weight: pat.weight || 50,
        }));
        return _entries;
      }
    }
  } catch {}
  _entries = [];
  return _entries;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ\s]/g, '')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function computeOverlap(textTokens: string[], phrase: string): number {
  const phraseTokens = tokenize(phrase);
  if (phraseTokens.length === 0) return 0;
  const set = new Set(textTokens);
  const matched = phraseTokens.filter((t) => set.has(t));
  return matched.length / phraseTokens.length;
}

export function semanticSearch(query: string, topK = 5): (KnowledgeEntry & { score: number })[] {
  const entries = loadEntries();
  if (entries.length === 0 || !query) return [];

  const tokens = tokenize(query);
  if (tokens.length === 0) return entries.slice(0, topK).map(e => ({ ...e, score: 0 }));

  const scored = entries.map((entry) => {
    let maxOverlap = 0;
    for (const phrase of entry.phrases) {
      const overlap = computeOverlap(tokens, phrase);
      if (overlap > maxOverlap) maxOverlap = overlap;
    }
    return { ...entry, score: maxOverlap * entry.weight };
  });

  return scored
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function getRelevantContext(extractedText: string, maxEntries = 5): string {
  const results = semanticSearch(extractedText, maxEntries);
  if (results.length === 0) return '';

  return results
    .map(
      (r) =>
        `[${r.category}] matched ${Math.round(r.score)} points — examples: ${r.excerpt}`,
    )
    .join('\n');
}
