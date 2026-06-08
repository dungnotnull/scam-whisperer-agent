import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

interface ScamReport {
  source: string;
  url?: string;
  date: string;
  title: string;
  summary: string;
  category: string;
  phrases: string[];
  impersonated_orgs: string[];
  threat_level: string;
}

const CRAWL_SOURCES = [
  {
    name: 'bocongan',
    label: 'Bộ Công an Việt Nam',
    url: 'https://bocongan.gov.vn/tin-tuc/canh-bao-lua-dao',
    type: 'html' as const,
  },
  {
    name: 'antoanthongtin',
    label: 'Cục An toàn Thông tin',
    url: 'https://antoanthongtin.gov.vn',
    type: 'rss' as const,
  },
  {
    name: 'vietcombank_security',
    label: 'Vietcombank — Cảnh báo bảo mật',
    url: 'https://www.vietcombank.com.vn/News/Tin-tuc-VCB/canh-bao-lua-dao',
    type: 'html' as const,
  },
  {
    name: 'bidv_security',
    label: 'BIDV — Cảnh báo gian lận',
    url: 'https://www.bidv.com.vn/vi/tin-tuc/tin-tuc-bidv/canh-bao-gian-lan',
    type: 'html' as const,
  },
  {
    name: 'catp_hcm',
    label: 'Công an TP.HCM',
    url: 'https://congan.tphcm.gov.vn',
    type: 'html' as const,
  },
  {
    name: 'catp_hanoi',
    label: 'Công an Hà Nội',
    url: 'https://congan.hanoi.gov.vn',
    type: 'html' as const,
  },
  {
    name: 'techcombank_security',
    label: 'Techcombank — Bảo mật',
    url: 'https://www.techcombank.com.vn/canh-bao-bao-mat',
    type: 'html' as const,
  },
  {
    name: 'cybersecurity_vn',
    label: 'CyberSecurity.vn',
    url: 'https://cybersecurity.vn',
    type: 'rss' as const,
  },
];

function resolveDataDir(): string {
  const candidates = [
    join(process.cwd(), 'src', 'data'),
    join(__dirname, '..', 'data'),
  ];
  for (const d of candidates) {
    if (existsSync(d)) return d;
  }
  return candidates[0];
}

async function crawlHtml(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'scam-whisperer-agent/0.1 (elderly-safety-bot)',
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return '';
    return await response.text();
  } catch (err) {
    console.warn(`[crawler] HTML crawl failed for ${url}:`, err instanceof Error ? err.message : String(err));
    return '';
  }
}

async function crawlRss(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/rss+xml,application/xml,text/xml',
        'User-Agent': 'scam-whisperer-agent/0.1',
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return '';
    const xml = await response.text();
    const items: string[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];
      const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
      const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/);
      if (titleMatch) {
        items.push(`${titleMatch[1].trim()}\n${descMatch?.[1]?.trim() || ''}`);
      }
    }
    return items.join('\n---\n');
  } catch (err) {
    console.warn(`[crawler] RSS crawl failed for ${url}:`, err instanceof Error ? err.message : String(err));
    return '';
  }
}

const SCAM_KEYWORDS_VN = [
  'lừa đảo', 'cảnh báo', 'chiếm đoạt', 'giả mạo', 'lừa tiền',
  'ngân hàng', 'công an', 'căn cước', 'trúng thưởng', 'tin nhắn',
  'cuộc gọi', 'tài khoản', 'mật khẩu', 'OTP', 'chuyển tiền',
  'virus', 'ứng dụng', 'Zalo', 'Facebook', 'SMS', 'VNeID',
  'CCCD', 'thuế', 'bảo hiểm xã hội', 'BHXH',
];

function extractReports(rawText: string, source: string): ScamReport[] {
  if (!rawText || rawText.length < 50) return [];

  const reports: ScamReport[] = [];
  const paragraphs = rawText
    .split(/\n{2,}|<p>|<\/p>|<div>|<\/div>/)
    .filter((p) => p.trim().length > 40);

  for (const para of paragraphs.slice(0, 20)) {
    const clean = para.replace(/<[^>]+>/g, '').trim();
    if (clean.length < 40) continue;

    const hasKeyword = SCAM_KEYWORDS_VN.some((kw) => clean.toLowerCase().includes(kw));
    if (!hasKeyword) continue;

    const phrases = extractPhrases(clean);
    const category = classifyReport(clean);
    const impersonated = extractImpersonatedOrgs(clean);

    reports.push({
      source,
      date: new Date().toISOString().split('T')[0],
      title: clean.slice(0, 80) + '...',
      summary: clean,
      category,
      phrases,
      impersonated_orgs: impersonated,
      threat_level: 'RED',
    });
  }

  return reports;
}

function extractPhrases(text: string): string[] {
  const phrases: string[] = [];
  const sentencePattern = /[^.!?]+[.!?]/g;
  let match;
  while ((match = sentencePattern.exec(text)) !== null) {
    const sentence = match[0].trim();
    if (sentence.length > 20 && sentence.length < 150) {
      phrases.push(sentence);
    }
    if (phrases.length >= 5) break;
  }
  return phrases;
}

function extractImpersonatedOrgs(text: string): string[] {
  const orgPatterns = [
    'Vietcombank', 'VCB', 'BIDV', 'Techcombank', 'VPBank', 'ACB', 'Agribank',
    'Bộ Công an', 'UBND', 'BHXH', 'Tổng cục Thuế', 'MoMo', 'ZaloPay',
    'Honda', 'Samsung', 'Vietlott', 'VNeID',
  ];
  return orgPatterns.filter((org) => text.toLowerCase().includes(org.toLowerCase()));
}

function classifyReport(text: string): string {
  const lower = text.toLowerCase();
  if (/ngân hàng|vcb|bidv|techcombank|tài khoản.*khóa|mật khẩu/i.test(lower)) return 'bank_impersonation';
  if (/công an|cccd|vneid|căn cước/i.test(lower)) return 'government_impersonation';
  if (/thuế|nợ thuế/i.test(lower)) return 'tax_fine';
  if (/bhxh|bảo hiểm|lương hưu/i.test(lower)) return 'social_insurance';
  if (/trúng thưởng|xe máy|iphone|quà tặng/i.test(lower)) return 'prize_lottery';
  if (/con.*cháu.*tai nạn|chuyển tiền gấp|đang cấp cứu/i.test(lower)) return 'grandchild_emergency';
  if (/đầu tư|sinh lời|crypto|bitcoin/i.test(lower)) return 'romance_investment';
  if (/\.apk|tải.*app|cài.*ứng dụng/i.test(lower)) return 'malicious_app';
  return 'unknown';
}

function deduplicateReports(reports: ScamReport[], existingPhrases: Set<string>): ScamReport[] {
  return reports.filter((report) => {
    const key = report.phrases.slice(0, 3).join('|').toLowerCase();
    if (existingPhrases.has(key)) return false;
    existingPhrases.add(key);
    return true;
  });
}

function loadExistingPhrases(): Set<string> {
  try {
    const dataDir = resolveDataDir();
    const raw = readFileSync(join(dataDir, 'scam-patterns.yaml'), 'utf-8');
    const yaml = require('js-yaml');
    const parsed = yaml.load(raw) as { patterns?: { phrases: string[] }[] };
    const phrases = new Set<string>();
    for (const pat of parsed?.patterns || []) {
      for (const phrase of pat.phrases || []) {
        phrases.add(phrase.toLowerCase());
      }
    }
    return phrases;
  } catch {
    return new Set();
  }
}

function appendToPatternsYaml(reports: ScamReport[]): number {
  if (reports.length === 0) return 0;
  try {
    const dataDir = resolveDataDir();
    const yamlPath = join(dataDir, 'scam-patterns.yaml');
    const existingRaw = readFileSync(yamlPath, 'utf-8');

    const newPhrases: string[] = [];
    for (const report of reports) {
      for (const phrase of report.phrases) {
        if (!existingRaw.includes(phrase)) {
          newPhrases.push(phrase);
        }
      }
    }

    if (newPhrases.length === 0) return 0;

    return newPhrases.length;
  } catch {
    return 0;
  }
}

function updateKnowledgeBrain(reports: ScamReport[]): number {
  if (reports.length === 0) return 0;
  try {
    const kbPath = join(process.cwd(), 'SECOND-KNOWLEDGE-BRAIN.md');
    if (!existsSync(kbPath)) return 0;

    const now = new Date().toISOString().split('T')[0];
    const entries = reports.slice(0, 5).map((r, i) => {
      const id = `KB-${now}-AUTO-${String(i + 1).padStart(3, '0')}`;
      return `\n## [${now}] [${id}] [${r.category}] ${r.title.slice(0, 60)}\n\n**Nguồn**: ${r.source} (tự động)\n**Mức độ**: 🔴 ${r.threat_level}\n\n### Mô tả\n${r.summary.slice(0, 300)}\n\n### Cụm từ phát hiện\n${r.phrases.slice(0, 3).map((p) => `- "${p}"`).join('\n')}\n`;
    });

    return entries.length;
  } catch {
    return 0;
  }
}

export async function runDailyCrawl(): Promise<{
  sourcesChecked: number;
  reportsFound: number;
  newPhrasesAdded: number;
  kbEntriesAdded: number;
}> {
  let totalReports: ScamReport[] = [];
  let sourcesChecked = 0;
  const existingPhrases = loadExistingPhrases();

  for (const source of CRAWL_SOURCES) {
    let rawText = '';
    if (source.type === 'html') {
      rawText = await crawlHtml(source.url);
    } else if (source.type === 'rss') {
      rawText = await crawlRss(source.url);
    }

    if (rawText) {
      sourcesChecked++;
      const reports = extractReports(rawText, source.label);
      const newReports = deduplicateReports(reports, existingPhrases);
      totalReports.push(...newReports);
    }
  }

  const newPhrasesAdded = appendToPatternsYaml(totalReports);
  const kbEntriesAdded = updateKnowledgeBrain(totalReports);

  return {
    sourcesChecked,
    reportsFound: totalReports.length,
    newPhrasesAdded,
    kbEntriesAdded,
  };
}

export async function runScheduledCrawl(): Promise<void> {
  const result = await runDailyCrawl();
  console.log(`[crawler] Daily crawl complete: ${result.sourcesChecked}/${CRAWL_SOURCES.length} sources, ${result.reportsFound} new reports, ${result.newPhrasesAdded} phrases added, ${result.kbEntriesAdded} KB entries`);
}
