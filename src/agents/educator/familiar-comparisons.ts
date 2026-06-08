// ─── Familiar Comparisons Library ────────────────────────────────────────────
// Relatable metaphors that make abstract digital scams concrete for elderly users.
// Evidence-based: AARP research shows comparisons increase scam recognition by 40%.
// Source: KB-2025-06-01-R002 — "Scam Detection Rates with Visual Explanations"

export function getFamiliarComparisons(): Record<string, string> {
  return {
    bank_phishing:
      'Giống như có người mặc đồng phục ngân hàng đến nhà xin mật khẩu thẻ ATM — ngân hàng thật sẽ không làm vậy bao giờ.',
    prize_scam:
      'Giống như người lạ ngoài đường nói ông bà trúng xe hơi vậy — của ngon không bao giờ đến dễ dàng như thế.',
    cccd_scam:
      'Cũng như ngày xưa có kẻ giả cảnh sát đến nhà để lừa — công an thật sẽ đến trực tiếp hoặc gửi giấy mời, không nhắn tin.',
    urgency_tactic:
      'Khi người ta nói "phải làm ngay bây giờ không là mất" — đó thường là dấu hiệu của lừa đảo. Việc thật sự không bao giờ gấp như vậy.',
    isolation_request:
      'Khi ai đó dặn "đừng kể cho con cháu biết" — đó chắc chắn là lừa đảo rồi. Người tốt không bao giờ bắt mình giữ bí mật với gia đình.',
    tax_scam:
      'Giống như có người gọi điện nói là nhân viên thuế đòi tiền mặt — cơ quan thuế thật chỉ làm việc qua văn bản và biên lai chính thức.',
    lottery_scam:
      'Vé số thật thì mình cầm vé đến đại lý đổi, chứ không ai gọi điện báo trúng rồi đòi đóng phí trước cả.',
    grandchild_scam:
      'Giống như ngày xưa có kẻ đến trường giả làm người nhà đến đón — mình phải gọi điện xác nhận với người thân trước khi tin.',
    investment_scam:
      'Giống như người lạ ngoài chợ rủ ông bà góp tiền buôn chung rồi hứa lãi gấp đôi — tiền đưa rồi thì không đòi lại được.',
    qr_scam:
      'Giống như ai đó dán bảng giá mới đè lên bảng giá cũ ở cửa hàng — nhìn kỹ tên người nhận trước khi quét mã để trả tiền.',
    apk_scam:
      'Giống như có người lạ đưa cái ổ khóa nói là "thay khóa miễn phí cho nhà mình" — cài ứng dụng lạ cũng nguy hiểm như cho người lạ vào nhà vậy.',
    // Generic fallbacks
    default_danger:
      'Giống như có người lạ gõ cửa nhà mình lúc nửa đêm — khi thấy không quen, mình không mở cửa. Với tin nhắn lạ cũng vậy.',
    default_safe:
      'Giống như nhận thư của người thân trong nhà — bình thường, quen thuộc, không có gì phải lo.',
  };
}
