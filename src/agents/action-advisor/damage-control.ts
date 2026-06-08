import type { ThreatLevel } from '../../types';

type EmergencyPhase = 'JUST_CLICKED' | 'PROVIDED_INFO' | 'SENT_MONEY' | 'INSTALLED_APP';

interface EmergencyGuide {
  immediateActions: string[];
  familyActions: string[];
  bankActions: string[];
  policeActions: string[];
  preventFurther: string[];
}

const EMERGENCY_GUIDES: Record<EmergencyPhase, EmergencyGuide> = {
  JUST_CLICKED: {
    immediateActions: [
      'Tắt wifi và dữ liệu di động ngay lập tức',
      'Không nhập thêm bất kỳ thông tin gì',
      'Tắt nguồn điện thoại nếu cần',
    ],
    familyActions: [
      'Gọi ngay cho người thân để báo tình hình',
      'Nhờ người thân đổi mật khẩu ngân hàng giúp',
    ],
    bankActions: [
      'Gọi hotline ngân hàng báo tài khoản nghi ngờ bị xâm nhập',
      'Yêu cầu tạm khóa tài khoản internet banking',
    ],
    policeActions: [],
    preventFurther: [
      'Không bật lại wifi cho đến khi người thân kiểm tra',
      'Không gỡ ứng dụng vì cần giữ chứng cứ',
    ],
  },
  PROVIDED_INFO: {
    immediateActions: [
      'Chụp lại màn hình những gì đã nhập (để làm chứng cứ)',
      'Tắt dữ liệu di động ngay lập tức',
      'Không xóa tin nhắn hay lịch sử giao dịch',
    ],
    familyActions: [
      'Gọi ngay cho người thân để cùng xử lý',
      'Nhờ người thân đổi tất cả mật khẩu quan trọng',
    ],
    bankActions: [
      'Gọi hotline ngân hàng ngay để cảnh báo',
      'Yêu cầu khóa tài khoản tạm thời nếu đã cung cấp thông tin đăng nhập',
      'Kiểm tra số dư và giao dịch gần đây',
    ],
    policeActions: [
      'Đến công an phường gần nhất để báo cáo',
      'Mang theo điện thoại có chứng cứ',
    ],
    preventFurther: [
      'Đổi mật khẩu email, Zalo, Facebook',
      'Bật xác thực 2 lớp cho tất cả tài khoản',
    ],
  },
  SENT_MONEY: {
    immediateActions: [
      'Gọi NGAY cho ngân hàng để phong tỏa giao dịch',
      'Chụp lại toàn bộ thông tin chuyển tiền',
      'Không xóa bất kỳ tin nhắn hay biên lai nào',
    ],
    familyActions: [
      'Gọi ngay cho người thân — đây là tình huống khẩn cấp',
      'Nhờ người thân đến ngân hàng cùng xử lý',
    ],
    bankActions: [
      'Gọi hotline ngân hàng — yêu cầu phong tỏa giao dịch ngay',
      'Đến chi nhánh ngân hàng gần nhất',
      'Yêu cầu ngân hàng truy vết tài khoản nhận tiền',
    ],
    policeActions: [
      'Đến công an quận/huyện để trình báo',
      'Cung cấp đầy đủ: số tài khoản gửi, số tài khoản nhận, thời gian, số tiền',
      'Nộp chứng cứ: ảnh chụp tin nhắn, biên lai chuyển tiền',
    ],
    preventFurther: [
      'Đổi toàn bộ mật khẩu ngân hàng',
      'Hủy thẻ ATM/credit nếu đã cung cấp thông tin thẻ',
    ],
  },
  INSTALLED_APP: {
    immediateActions: [
      'Tắt wifi và dữ liệu di động ngay',
      'KHÔNG mở ứng dụng vừa cài',
      'KHÔNG gỡ ứng dụng (cần giữ để điều tra)',
    ],
    familyActions: [
      'Gọi ngay cho người thân để được hỗ trợ kỹ thuật',
      'Nhờ người thân kiểm tra điện thoại',
    ],
    bankActions: [
      'Gọi ngân hàng khóa tài khoản internet banking ngay',
      'Không đăng nhập ứng dụng ngân hàng trên điện thoại đó',
    ],
    policeActions: [
      'Đến công an nếu phát hiện mất tiền',
      'Mang theo điện thoại để làm chứng cứ',
    ],
    preventFurther: [
      'Mang điện thoại đến cửa hàng uy tín để kiểm tra và gỡ phần mềm độc hại',
      'Khôi phục cài đặt gốc sau khi sao lưu dữ liệu an toàn',
    ],
  },
};

export function detectEmergencyPhase(userStatement: string): EmergencyPhase | null {
  const lower = userStatement.toLowerCase();
  if (/(đã chuyển tiền|chuyển tiền rồi|mất tiền|đã gửi tiền|bị lừa tiền)/.test(lower)) return 'SENT_MONEY';
  if (/(đã cài|cài app|cài ứng dụng|tải về rồi|đã tải|đã cài đặt)/.test(lower)) return 'INSTALLED_APP';
  if (/(đã nhập|đã gửi thông tin|đã cung cấp|đã điền|đã khai)/.test(lower)) return 'PROVIDED_INFO';
  if (/(bấm vào rồi|đã bấm|đã click|đã nhấn|đã mở link|vào link rồi)/.test(lower)) return 'JUST_CLICKED';
  return null;
}

export function getEmergencyGuide(phase: EmergencyPhase): EmergencyGuide {
  return EMERGENCY_GUIDES[phase];
}

export function formatEmergencyResponse(
  phase: EmergencyPhase,
  threatLevel: ThreatLevel,
  formOfAddress = 'ông/bà',
): string {
  const guide = getEmergencyGuide(phase);
  const urgency = threatLevel === 'RED' ? 'NGAY BÂY GIỜ' : 'CÀNG SỚM CÀNG TỐT';

  let response = `${formOfAddress} ơi, ${formOfAddress} cần làm những việc sau ${urgency}:\n\n`;

  response += '🚨 VIỆC CẦN LÀM NGAY:\n';
  guide.immediateActions.forEach((a, i) => {
    response += `  ${i + 1}. ${a}\n`;
  });

  if (guide.bankActions.length > 0) {
    response += '\n🏦 LIÊN HỆ NGÂN HÀNG:\n';
    guide.bankActions.forEach((a, i) => {
      response += `  ${i + 1}. ${a}\n`;
    });
  }

  if (guide.familyActions.length > 0) {
    response += '\n👨‍👩‍👧‍👦 BÁO NGƯỜI THÂN:\n';
    guide.familyActions.forEach((a, i) => {
      response += `  ${i + 1}. ${a}\n`;
    });
  }

  if (guide.policeActions.length > 0) {
    response += '\n👮 TRÌNH BÁO CÔNG AN:\n';
    guide.policeActions.forEach((a, i) => {
      response += `  ${i + 1}. ${a}\n`;
    });
  }

  response += `\n${formOfAddress} đừng lo, làm từng bước một là được. Cháu sẽ báo người thân của ${formOfAddress} ngay bây giờ.`;

  return response;
}
