import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

let _phoneDb: Set<string> | null = null;

function loadPhoneDb(): Set<string> {
  if (_phoneDb) return _phoneDb;
  try {
    const candidates = [
      join(process.cwd(), 'src', 'data', 'scam-database.json'),
      join(__dirname, '..', '..', 'data', 'scam-database.json'),
    ];
    for (const p of candidates) {
      if (existsSync(p)) {
        const raw = readFileSync(p, 'utf-8');
        const data = JSON.parse(raw);
        const phones: string[] = data.known_scam_phones || [];
        _phoneDb = new Set(phones.map(normalizePhone));
        return _phoneDb;
      }
    }
  } catch {}
  _phoneDb = new Set();
  return _phoneDb;
}

export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s.\-()]/g, '');
  if (cleaned.startsWith('+84')) cleaned = '0' + cleaned.slice(3);
  if (cleaned.startsWith('84') && cleaned.length > 9) cleaned = '0' + cleaned.slice(2);
  return cleaned;
}

export interface PhoneCheckResult {
  knownScamPhones: string[];
  checkedCount: number;
}

export function checkPhones(phoneNumbers: string[]): PhoneCheckResult {
  if (phoneNumbers.length === 0) return { knownScamPhones: [], checkedCount: 0 };
  const db = loadPhoneDb();
  const normalized = phoneNumbers.map(normalizePhone);
  const known = normalized.filter((p) => db.has(p));
  return { knownScamPhones: known, checkedCount: phoneNumbers.length };
}

export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/[\s.\-()]/g, '');
  if (cleaned.length < 7) return '***';
  return cleaned.slice(0, 3) + '***' + cleaned.slice(-3);
}
