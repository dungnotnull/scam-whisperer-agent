import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

interface UserReport {
  id: string;
  timestamp: string;
  userId: string;
  imageBase64?: string;
  textDescription: string;
  threatLevel: string;
  scamCategory: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'ADDED_TO_KB';
  reviewedBy?: string;
  reviewedAt?: string;
  phoneNumbers: string[];
  bankAccounts: string[];
}

function resolveDataDir(): string {
  const candidates = [join(process.cwd(), 'src', 'data'), join(__dirname, '..', 'data')];
  for (const d of candidates) if (existsSync(d)) return d;
  return candidates[0];
}

function getReportsPath(): string {
  return join(resolveDataDir(), 'user-reports.json');
}

function loadReports(): UserReport[] {
  try {
    const path = getReportsPath();
    if (!existsSync(path)) return [];
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return [];
  }
}

function saveReports(reports: UserReport[]): void {
  writeFileSync(getReportsPath(), JSON.stringify(reports, null, 2), 'utf-8');
}

export function submitReport(
  userId: string,
  imageBase64: string | undefined,
  textDescription: string,
  threatLevel: string,
  scamCategory: string,
  phoneNumbers: string[] = [],
  bankAccounts: string[] = [],
): UserReport {
  const reports = loadReports();
  const report: UserReport = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    userId,
    imageBase64,
    textDescription,
    threatLevel,
    scamCategory,
    status: 'PENDING',
    phoneNumbers,
    bankAccounts,
  };
  reports.push(report);
  saveReports(reports);
  return report;
}

export function getPendingReports(): UserReport[] {
  return loadReports().filter((r) => r.status === 'PENDING');
}

export function getReportsByUser(userId: string): UserReport[] {
  return loadReports().filter((r) => r.userId === userId);
}

export function reviewReport(reportId: string, status: 'VERIFIED' | 'REJECTED' | 'ADDED_TO_KB', reviewerId: string): UserReport | null {
  const reports = loadReports();
  const report = reports.find((r) => r.id === reportId);
  if (!report) return null;
  report.status = status;
  report.reviewedBy = reviewerId;
  report.reviewedAt = new Date().toISOString();
  saveReports(reports);
  return report;
}

export function getCommunityIntelligence(): {
  phones: Array<{ phone: string; reports: number }>;
  accounts: Array<{ account: string; reports: number }>;
} {
  const reports = loadReports().filter((r) => r.status === 'VERIFIED' || r.status === 'ADDED_TO_KB');
  const phoneMap = new Map<string, number>();
  const accountMap = new Map<string, number>();

  for (const report of reports) {
    for (const phone of report.phoneNumbers) {
      phoneMap.set(phone, (phoneMap.get(phone) || 0) + 1);
    }
    for (const account of report.bankAccounts) {
      accountMap.set(account, (accountMap.get(account) || 0) + 1);
    }
  }

  const phones = Array.from(phoneMap.entries())
    .filter(([, count]) => count >= 3)
    .map(([phone, reports]) => ({ phone, reports }));

  const accounts = Array.from(accountMap.entries())
    .filter(([, count]) => count >= 3)
    .map(([account, reports]) => ({ account, reports }));

  return { phones, accounts };
}

export function promoteToScamDatabase(reportId: string): boolean {
  const reports = loadReports();
  const report = reports.find((r) => r.id === reportId);
  if (!report || report.status !== 'ADDED_TO_KB') return false;

  try {
    const dataDir = resolveDataDir();
    const dbPath = join(dataDir, 'scam-database.json');
    const db = JSON.parse(readFileSync(dbPath, 'utf-8'));

    for (const phone of report.phoneNumbers) {
      if (!db.known_scam_phones.includes(phone)) {
        db.known_scam_phones.push(phone);
      }
    }
    for (const account of report.bankAccounts) {
      if (!db.known_scam_accounts.includes(account)) {
        db.known_scam_accounts.push(account);
      }
    }
    db.total_entries = db.known_scam_phones.length + db.known_scam_accounts.length;
    db.last_updated = new Date().toISOString().split('T')[0];

    writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

export function addUserReportRoute(server: any): void {
  server.post('/report', (req: any, res: any) => {
    const { user_id, image_base64, text_description, threat_level, scam_category, phone_numbers, bank_accounts } = req.body;
    if (!user_id || !text_description) {
      return res.status(400).json({ error: 'user_id and text_description are required' });
    }
    const report = submitReport(user_id, image_base64, text_description, threat_level || 'RED', scam_category || 'unknown', phone_numbers || [], bank_accounts || []);
    res.json({ status: 'submitted', report_id: report.id });
  });

  server.get('/reports/pending', (_req: any, res: any) => {
    res.json({ reports: getPendingReports() });
  });

  server.get('/reports/community', (_req: any, res: any) => {
    res.json(getCommunityIntelligence());
  });

  server.post('/reports/:id/review', (req: any, res: any) => {
    const { id } = req.params;
    const { status, reviewer_id } = req.body;
    const result = reviewReport(id, status, reviewer_id);
    if (!result) return res.status(404).json({ error: 'Report not found' });
    if (status === 'ADDED_TO_KB') promoteToScamDatabase(id);
    res.json({ status: 'ok', report: result });
  });
}
