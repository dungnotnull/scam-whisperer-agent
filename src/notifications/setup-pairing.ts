import { randomUUID } from 'node:crypto';
import type { UserProfile, Guardian } from '../types';
import { guardianRegistry } from './guardian-manager';

interface PairingCode {
  code: string;
  userId: string;
  guardianId: string;
  expiresAt: Date;
  used: boolean;
}

class PairingManager {
  private codes = new Map<string, PairingCode>();

  generatePairingCode(userId: string, guardianId: string): string {
    this.cleanExpired();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.codes.set(code, {
      code,
      userId,
      guardianId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      used: false,
    });
    return code;
  }

  generateQrData(userId: string, guardianId: string): string {
    const code = this.generatePairingCode(userId, guardianId);
    return JSON.stringify({
      type: 'scam-whisperer-pairing',
      code,
      userId,
      guardianId,
    });
  }

  verifyCode(code: string): PairingCode | null {
    this.cleanExpired();
    const pairing = this.codes.get(code.toUpperCase());
    if (!pairing || pairing.expiresAt < new Date() || pairing.used) return null;
    pairing.used = true;
    return pairing;
  }

  private cleanExpired(): void {
    const now = new Date();
    for (const [code, pairing] of this.codes) {
      if (pairing.expiresAt < now) this.codes.delete(code);
    }
  }
}

export const pairingManager = new PairingManager();

export function createUserProfile(
  name: string,
  formOfAddress: UserProfile['formOfAddress'],
  region: UserProfile['region'],
  voicePreference: UserProfile['voicePreference'],
  primaryGuardianId: string,
  fontSize = 22,
): UserProfile {
  const profile: UserProfile = {
    id: randomUUID(),
    name,
    formOfAddress,
    region,
    voicePreference,
    primaryGuardianId,
    fontSize,
    lessonsLearned: [],
  };

  guardianRegistry.registerUser(profile);
  return profile;
}

export function createGuardian(
  name: string,
  phone: string,
  role: Guardian['role'] = 'PRIMARY',
): Guardian {
  return {
    id: randomUUID(),
    name,
    phone,
    role,
    notification_preferences: {
      red_alerts: true,
      orange_alerts: role === 'PRIMARY',
      weekly_digest: true,
      channel: 'zalo',
    },
  };
}

export function setupGuardianLink(
  userId: string,
  guardian: Guardian,
): { pairingCode: string; qrData: string } {
  guardianRegistry.registerGuardian(guardian);
  guardianRegistry.linkUserToGuardian(userId, guardian.id);

  const pairingCode = pairingManager.generatePairingCode(userId, guardian.id);
  const qrData = pairingManager.generateQrData(userId, guardian.id);

  return { pairingCode, qrData };
}

export function completePairing(code: string): { userId: string; guardianId: string } | null {
  const pairing = pairingManager.verifyCode(code);
  if (!pairing) return null;
  return { userId: pairing.userId, guardianId: pairing.guardianId };
}
