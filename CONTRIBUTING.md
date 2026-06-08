# CONTRIBUTING.md

Cảm ơn bạn đã quan tâm đóng góp cho **scam-whisperer-agent** — trợ lý bảo vệ người cao tuổi Việt Nam trước lừa đảo số.

## Cách đóng góp

### Báo cáo lừa đảo mới (Ưu tiên cao nhất)

Mỗi mẫu lừa đảo mới bạn gửi giúp bảo vệ hàng ngàn người cao tuổi. Nếu bạn phát hiện một chiêu thức lừa đảo mới (SMS, Zalo, Facebook, email, cuộc gọi), vui lòng:

1. Mở một Issue với tiêu đề `[SCAM REPORT] Mô tả ngắn`
2. Cung cấp: nội dung tin nhắn, số điện thoại (nếu có), URL (nếu có), tổ chức bị giả mạo
3. Chúng tôi sẽ thêm vào cơ sở dữ liệu và cập nhật pattern trong vòng 24 giờ

### Báo cáo lỗi (Bug)

1. Kiểm tra Issues hiện có để tránh trùng lặp
2. Mô tả: bạn đã làm gì, mong đợi gì, kết quả thực tế
3. Cung cấp logs nếu có (`npm run dev` để xem logs)

### Gửi Pull Request

1. Fork repository
2. Tạo branch: `feature/ten-tinh-nang` hoặc `fix/ten-loi`
3. Code của bạn phải:
   - TypeScript biên dịch sạch (`npm run typecheck`)
   - Build thành công (`npm run build`)
   - Không phá vỡ pipeline hiện tại
4. Mở Pull Request với mô tả rõ ràng

### Tiêu chuẩn code

- Ngôn ngữ: TypeScript, strict mode
- Format: Prettier (chạy `npm run format`)
- Lỗi: ESLint (chạy `npm run lint`)
- Tất cả text hướng đến người dùng phải bằng tiếng Việt giản dị, qua "Grandchild Test"

### Các hạng mục cần giúp

- [ ] Thêm mẫu lừa đảo mới vào `src/data/scam-patterns.yaml`
- [ ] Cập nhật số điện thoại/tài khoản lừa đảo vào `src/data/scam-database.json`
- [ ] Cải thiện prompt LLM cho phân loại chính xác hơn
- [ ] Thêm familiar comparisons tiếng Việt
- [ ] Dịch UI sang thêm ngôn ngữ dân tộc thiểu số
- [ ] Cải thiện chất lượng giọng nói TTS

### Câu hỏi?

Mở một Discussion hoặc Issue với tag `question`.
