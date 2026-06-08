import type { FamilyAlert, AlertType, ThreatLevel } from '../types';

interface NotificationChannel {
  name: string;
  send: (alert: FamilyAlert) => Promise<boolean>;
}

interface ZaloZnsConfig {
  appId: string;
  appSecret: string;
  templateId: string;
}

async function sendViaZalo(alert: FamilyAlert): Promise<boolean> {
  const appId = process.env.ZALO_APP_ID;
  const appSecret = process.env.ZALO_APP_SECRET;
  if (!appId || !appSecret) return false;

  const accessToken = await getZaloAccessToken(appId, appSecret);
  if (!accessToken) return false;

  try {
    const response = await fetch('https://business.openapi.zalo.me/message/template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': accessToken,
      },
      body: JSON.stringify({
        phone: alert.phone_numbers?.[0] || '',
        template_id: 'scam_alert_template',
        template_data: {
          user_name: alert.elderly_user_name,
          threat_level: alert.threat_level,
          summary: alert.summary_vi,
          action: alert.family_action_needed || 'Không cần hành động gì',
          time: alert.timestamp.toISOString(),
        },
      }),
    });

    if (!response.ok) {
      console.warn(`[zalo] ZNS send failed: ${response.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[zalo] ZNS error:', err instanceof Error ? err.message : String(err));
    return false;
  }
}

async function getZaloAccessToken(appId: string, appSecret: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://oauth.zaloapp.com/v4/oa/access_token?app_id=${appId}&app_secret=${appSecret}&grant_type=refresh_token`,
      { method: 'POST' },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { access_token?: string };
    return data.access_token || null;
  } catch {
    return null;
  }
}

async function sendViaFCM(alert: FamilyAlert): Promise<boolean> {
  const fcmKey = process.env.FCM_SERVER_KEY;
  if (!fcmKey) return false;

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${fcmKey}`,
      },
      body: JSON.stringify({
        priority: 'high',
        data: {
          type: alert.type,
          threat_level: alert.threat_level,
          elderly_user_name: alert.elderly_user_name,
          summary: alert.summary_vi,
          action_needed: alert.family_action_needed || 'none',
          timestamp: alert.timestamp.toISOString(),
        },
        notification: {
          title: alert.threat_level === 'RED' ? '🚨 Cảnh báo khẩn cấp' : '⚠️ Cảnh báo lừa đảo',
          body: alert.summary_vi,
          sound: alert.threat_level === 'RED' ? 'emergency.wav' : 'default',
        },
      }),
    });

    return response.ok;
  } catch (err) {
    console.warn('[fcm] Push failed:', err instanceof Error ? err.message : String(err));
    return false;
  }
}

async function sendViaSMS(alert: FamilyAlert): Promise<boolean> {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_FROM_NUMBER;
  if (!twilioSid || !twilioToken || !twilioFrom) return false;

  try {
    const smsBody = `[scam-whisperer] ${alert.summary_vi}. ${alert.family_action_needed || 'Không cần hành động.'} - Lúc ${alert.timestamp.toLocaleTimeString('vi-VN')}`;
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: alert.phone_numbers?.[0] || '', From: twilioFrom, Body: smsBody }).toString(),
      },
    );
    return response.ok;
  } catch (err) {
    console.warn('[sms] SMS send failed:', err instanceof Error ? err.message : String(err));
    return false;
  }
}

const CHANNELS: NotificationChannel[] = [
  { name: 'zalo', send: sendViaZalo },
  { name: 'fcm', send: sendViaFCM },
  { name: 'sms', send: sendViaSMS },
];

export async function sendAlert(alert: FamilyAlert): Promise<{ delivered: string[]; failed: string[] }> {
  const delivered: string[] = [];
  const failed: string[] = [];

  for (const channel of CHANNELS) {
    try {
      const success = await channel.send(alert);
      if (success) {
        delivered.push(channel.name);
        if (channel.name === 'zalo') break;
      } else {
        failed.push(channel.name);
      }
    } catch {
      failed.push(channel.name);
    }
  }

  if (delivered.length === 0) {
    console.error('[alerts] All notification channels failed for alert');
  }

  return { delivered, failed };
}

export function shouldAlert(threatLevel: ThreatLevel, alertType: AlertType): boolean {
  if (threatLevel === 'RED') return true;
  if (threatLevel === 'ORANGE') return true;
  if (threatLevel === 'YELLOW') return alertType === 'WEEKLY_DIGEST';
  return false;
}

export function calculateAlertDelay(threatLevel: ThreatLevel): number {
  switch (threatLevel) {
    case 'RED': return 0;
    case 'ORANGE': return 30_000;
    case 'YELLOW': return 0;
    default: return 0;
  }
}
