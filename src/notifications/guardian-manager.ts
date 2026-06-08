import type { FamilyAlert, Guardian, UserProfile } from '../types';
import { sendAlert, shouldAlert, calculateAlertDelay } from './alert-router';

interface GuardianRecord {
  guardian: Guardian;
  userProfiles: string[];
}

class GuardianRegistry {
  private guardians = new Map<string, GuardianRecord>();
  private userProfiles = new Map<string, UserProfile>();

  registerGuardian(guardian: Guardian): void {
    this.guardians.set(guardian.id, { guardian, userProfiles: [] });
  }

  linkUserToGuardian(userId: string, guardianId: string): void {
    const record = this.guardians.get(guardianId);
    if (record && !record.userProfiles.includes(userId)) {
      record.userProfiles.push(userId);
    }
  }

  registerUser(profile: UserProfile): void {
    this.userProfiles.set(profile.id, profile);
  }

  getGuardiansForUser(userId: string): Guardian[] {
    const result: Guardian[] = [];
    for (const record of this.guardians.values()) {
      if (record.userProfiles.includes(userId)) {
        result.push(record.guardian);
      }
    }
    return result;
  }

  getPrimaryGuardian(userId: string): Guardian | undefined {
    const user = this.userProfiles.get(userId);
    if (!user) return undefined;
    return this.guardians.get(user.primaryGuardianId)?.guardian;
  }

  getAllGuardians(): Guardian[] {
    return Array.from(this.guardians.values()).map((r) => r.guardian);
  }

  getAllUsers(): UserProfile[] {
    return Array.from(this.userProfiles.values());
  }
}

export const guardianRegistry = new GuardianRegistry();

export async function notifyGuardians(
  alert: FamilyAlert,
  guardians: Guardian[],
  _userProfile: UserProfile,
): Promise<void> {
  const primaryGuardians = guardians.filter((g) => g.role === 'PRIMARY');
  const secondaryGuardians = guardians.filter((g) => g.role === 'SECONDARY');

  const targets = [...primaryGuardians];
  if (alert.threat_level === 'RED') {
    targets.push(...secondaryGuardians);
  }

  const delay = calculateAlertDelay(alert.threat_level);
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  const alerts = targets.map(async (guardian) => {
    const guardianAlert: FamilyAlert = {
      ...alert,
      phone_numbers: [guardian.phone],
    };
    return sendAlert(guardianAlert);
  });

  await Promise.allSettled(alerts);
}

export async function processAlert(
  alert: FamilyAlert,
  userId: string,
): Promise<{ notified: number; channels: string[] }> {
  if (!shouldAlert(alert.threat_level, alert.type)) {
    return { notified: 0, channels: [] };
  }

  const userProfile = guardianRegistry.getAllUsers().find((u) => u.id === userId);
  if (!userProfile) {
    return { notified: 0, channels: [] };
  }

  const guardians = guardianRegistry.getGuardiansForUser(userId);
  if (guardians.length === 0) {
    return { notified: 0, channels: [] };
  }

  await notifyGuardians(alert, guardians, userProfile);

  return { notified: guardians.length, channels: ['zalo', 'fcm', 'sms'] };
}

export function generateWeeklyDigest(userId: string): FamilyAlert | null {
  const user = guardianRegistry.getAllUsers().find((u) => u.id === userId);
  if (!user) return null;

  return {
    type: 'WEEKLY_DIGEST',
    timestamp: new Date(),
    elderly_user_name: user.name,
    threat_level: 'GREEN',
    summary_vi: `Báo cáo tuần cho ${user.name}: không có sự cố lừa đảo nào được phát hiện.`,
    action_taken: 'Theo dõi định kỳ',
    family_action_needed: null,
    phone_numbers: [],
    urls: [],
  };
}
