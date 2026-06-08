import type { ScamCategory } from '../../types';
import { getFamiliarComparisons } from './familiar-comparisons';

// ─── Educator ────────────────────────────────────────────────────────────────
// Provides gentle, non-repeating educational tips after scam verdicts.
// Tips are tracked per user via Redis-backed "lessons learned" log.
// In Phase 0: in-memory Set fallback.

// In-memory lesson tracker (will be Redis-backed in production)
const userLessonsLearned = new Map<string, Set<string>>();

const TIP_LIBRARY: Record<string, string[]> = {
  prize_lottery: [
    'Bà biết không? Công ty thật như Honda hay Samsung không bao giờ nhắn tin báo trúng thưởng đâu ạ.',
    'Ông nhớ nhé, của ngon không bao giờ đến dễ dàng vậy đâu. Trúng thưởng thật thì phải có vé số hoặc hóa đơn mua hàng.',
    'Người xấu hay dùng chiêu "trúng xe máy" để lừa mình đóng phí vận chuyển rồi mất tiền đó ạ.',
  ],
  bank_account_freeze: [
    'Ngân hàng thật sẽ không bao giờ gửi tin nhắn yêu cầu ông bà bấm vào link để đăng nhập đâu ạ.',
    'Khi thấy tin nhắn nói tài khoản bị khóa, cứ gọi thẳng số hotline ngân hàng để hỏi cho chắc nhé.',
  ],
  bank_password_phishing: [
    'Không ai được phép hỏi mật khẩu ngân hàng của mình, kể cả nhân viên ngân hàng thật đâu ạ.',
    'Mã OTP là chìa khóa cuối cùng của tài khoản. Đừng bao giờ đọc OTP cho ai qua điện thoại nhé.',
  ],
  cccd_update: [
    'Công an thật sẽ không bao giờ gọi điện yêu cầu cập nhật CCCD đâu ạ. Họ gửi giấy mời tận nhà hoặc thông báo qua phường.',
    'Ứng dụng VNeID thật chỉ có trên CH Play hoặc App Store. Không có app nào tên "VNeID 2.0" hay "VNeID cập nhật" đâu ạ.',
  ],
  tax_fine: [
    'Cơ quan thuế luôn gửi thông báo bằng văn bản qua bưu điện, không qua Zalo hay điện thoại đâu ạ.',
    'Không có chuyện đóng tiền phạt qua điện thoại hay chuyển khoản cá nhân đâu ông bà ơi.',
  ],
  social_insurance: [
    'Tiền hỗ trợ của Nhà nước được thông báo qua UBND phường và chuyển thẳng vào tài khoản, không cần làm gì thêm.',
    'BHXH không gọi điện hỏi số tài khoản ngân hàng. Tiền hưu trí được chuyển tự động hàng tháng.',
  ],
  grandchild_emergency: [
    'Nếu có ai gọi nói là con cháu đang gặp nạn cần tiền gấp, cứ gọi ngay vào số điện thoại cũ của con để xác nhận.',
    'Người xấu biết ông bà thương con cháu lắm nên mới dùng chiêu này. Đừng chuyển tiền trước khi nói chuyện được với con.',
  ],
  romance_scam: [
    'Người lạ trên mạng không bao giờ muốn giúp mình làm giàu đâu ạ. Lợi nhuận cao luôn đi kèm rủi ro.',
    'Đầu tư tiền ảo mà người lạ giới thiệu qua Zalo hay Facebook hầu như đều là lừa đảo đó ạ.',
  ],
  malicious_apk: [
    'Ứng dụng ngân hàng thật chỉ có trên CH Play hoặc App Store. Link lạ dẫn đến file .apk là bẫy đó ạ.',
    'Cài ứng dụng từ link lạ có thể khiến điện thoại bị theo dõi, đọc hết tin nhắn kể cả mã OTP.',
  ],
  qr_code_scam: [
    'Khi quét mã QR để thanh toán, nhớ kiểm tra kỹ tên người nhận tiền trước khi bấm xác nhận nhé.',
    'Người xấu hay dán đè mã QR của mình lên mã QR của cửa hàng. Nhìn kỹ trước khi quét ạ.',
  ],
  spam_advertising: [
    'Đây là quảng cáo không mời mà đến. Ông bà có thể chặn số này để khỏi nhận tin nhắn nữa.',
    'Tin nhắn quảng cáo thì không nguy hiểm, nhưng cũng đừng bấm vào link trong đó nhé.',
  ],
  legitimate: [
    'Ông bà làm đúng rồi khi hỏi trước! Kiểm tra trước khi bấm là rất khôn ngoan đó ạ.',
    'Tin nhắn này an toàn. Ông bà ngày càng giỏi nhận diện lừa đảo rồi đó!',
  ],
  unknown: [
    'Mỗi lần kiểm tra là một lần ông bà giỏi hơn trong việc nhận diện lừa đảo đó ạ.',
    'Cháu luôn ở đây để kiểm tra giúp ông bà bất cứ lúc nào.',
  ],
};

// ─── Celebration Messages ───────────────────────────────────────────────────

const CELEBRATION_MESSAGES = [
  'Ông bà làm đúng rồi khi hỏi trước! Kiểm tra trước khi bấm là rất khôn ngoan đó ạ.',
  'Bà giỏi quá! Nhờ bà hỏi mà tránh được một cái bẫy đó.',
  'Ông thật là cẩn thận. Hỏi trước không bao giờ là thừa đâu ạ.',
  'Bà làm rất đúng! Người xấu giờ tinh vi lắm, ai cũng có thể bị lừa được.',
];

function getRandomCelebration(): string {
  return CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
}

// ─── Tip Selection ───────────────────────────────────────────────────────────

export function getEducationalTip(
  scamCategory: ScamCategory,
  userId?: string,
): string | undefined {
  const category = scamCategory || 'unknown';
  const tips = TIP_LIBRARY[category] || TIP_LIBRARY.unknown;

  // Track which tips the user has seen
  if (userId) {
    if (!userLessonsLearned.has(userId)) {
      userLessonsLearned.set(userId, new Set());
    }
    const seen = userLessonsLearned.get(userId)!;

    // Find an unseen tip
    const unseenTip = tips.find((tip) => !seen.has(tip));
    if (unseenTip) {
      seen.add(unseenTip);
      return unseenTip;
    }

    // All tips seen — start over but add a marker
    if (seen.size >= tips.length) {
      seen.clear();
      seen.add(tips[0]);
      return tips[0];
    }

    return tips[0];
  }

  // No user ID — random tip
  return tips[Math.floor(Math.random() * tips.length)];
}

export function getCelebration(userId?: string): string {
  return getRandomCelebration();
}

export function getFamiliarComparisonForCategory(
  category: ScamCategory,
): string | undefined {
  const comparisons = getFamiliarComparisons();
  return (comparisons as Record<string, string>)[category];
}

export function resetLessonsForUser(userId: string): void {
  userLessonsLearned.delete(userId);
}
