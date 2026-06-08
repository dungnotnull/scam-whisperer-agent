import type { ThreatLevel } from '../../types';

// ─── Action Advisor ──────────────────────────────────────────────────────────
// Generates simple, numbered action steps for elderly users.
// Maximum 3 steps. Simple verbs. No technical language.

type DetectionScenario = 'FRESH' | 'ALREADY_CLICKED' | 'ALREADY_SENT_MONEY';

const ACTION_TEMPLATES: Record<ThreatLevel, Record<DetectionScenario, string[]>> = {
  RED: {
    FRESH: [
      'Tuyệt đối đừng bấm vào bất kỳ thứ gì trong tin nhắn đó',
      'Xóa tin nhắn đó đi ngay',
      'Gọi cho người thân nếu ông/bà vẫn lo',
    ],
    ALREADY_CLICKED: [
      'Tắt wifi và dữ liệu điện thoại ngay lập tức',
      'Gọi cho người thân ngay bây giờ',
      'Đổi mật khẩu ngân hàng qua điện thoại của người thân',
    ],
    ALREADY_SENT_MONEY: [
      'Gọi ngay cho ngân hàng để khóa tài khoản',
      'Gọi cho người thân ngay bây giờ',
      'Báo cáo lên công an phường gần nhất',
    ],
  },
  ORANGE: {
    FRESH: [
      'Khoan bấm vào gì trong tin nhắn này nhé',
      'Gọi thẳng số chính thức của nơi gửi để xác nhận',
      'Kể lại cho người thân nghe về tin nhắn này',
    ],
    ALREADY_CLICKED: [
      'Tắt wifi và dữ liệu điện thoại ngay',
      'Gọi cho người thân ngay bây giờ',
      'Kiểm tra tài khoản ngân hàng xem có gì lạ không',
    ],
    ALREADY_SENT_MONEY: [
      'Gọi ngay cho ngân hàng để khóa tài khoản',
      'Gọi cho người thân ngay bây giờ',
      'Báo cáo lên công an phường gần nhất',
    ],
  },
  YELLOW: {
    FRESH: [
      'Đây trông có vẻ ổn nhưng ông/bà cứ cẩn thận nhé',
      'Gọi cho người thân nếu ông/bà không chắc',
      'Không cung cấp thông tin cá nhân cho người lạ',
    ],
    ALREADY_CLICKED: [
      'Tắt dữ liệu điện thoại để an toàn',
      'Gọi cho người thân để kiểm tra',
      'Đừng nhập thêm thông tin gì nữa nhé',
    ],
    ALREADY_SENT_MONEY: [
      'Gọi ngay cho ngân hàng để kiểm tra',
      'Gọi cho người thân ngay bây giờ',
      'Báo cáo lên công an phường nếu thấy nghi ngờ',
    ],
  },
  GREEN: {
    FRESH: [
      'Tin nhắn này an toàn, ông/bà không cần lo gì cả',
      'Ông/bà làm đúng rồi khi hỏi trước!',
    ],
    ALREADY_CLICKED: ['Tin nhắn này an toàn, không cần lo lắng gì đâu ạ'],
    ALREADY_SENT_MONEY: [
      'Vẫn nên gọi ngân hàng kiểm tra lại cho chắc nhé',
      'Gọi cho người thân để cùng kiểm tra',
    ],
  },
};

export function generateActionSteps(threatLevel: ThreatLevel, scenario: DetectionScenario): string[] {
  return ACTION_TEMPLATES[threatLevel][scenario] || ACTION_TEMPLATES.GREEN.FRESH;
}

export function shouldSkipExplanation(followUpContext?: string): boolean {
  if (!followUpContext) return false;
  const emergencyTriggers = [
    'bấm vào rồi',
    'đã bấm',
    'đã nhập',
    'đã chuyển tiền',
    'chuyển tiền rồi',
    'mất tiền rồi',
    'bị lừa rồi',
  ];
  const lower = followUpContext.toLowerCase();
  return emergencyTriggers.some((t) => lower.includes(t));
}

// ─── Bank Hotline Database ───────────────────────────────────────────────────

export const BANK_HOTLINES: Record<string, string> = {
  vietcombank: '1900 54 54 13',
  bidv: '1900 92 47',
  techcombank: '1800 588 822',
  vpbank: '1900 54 54 15',
  acb: '1900 54 54 86',
  agribank: '1900 55 88 18',
  sacombank: '1900 55 55 88',
  mbbank: '1900 54 54 26',
  tpbank: '1900 58 58 85',
  oceanbank: '1800 58 88 15',
};

export function getBankHotline(bankName?: string): string | null {
  if (!bankName) return null;
  const lower = bankName.toLowerCase();
  for (const [key, hotline] of Object.entries(BANK_HOTLINES)) {
    if (lower.includes(key)) return hotline;
  }
  return null;
}
