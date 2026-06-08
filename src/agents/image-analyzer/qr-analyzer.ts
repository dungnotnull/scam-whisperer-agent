import type { ExtractionResult } from '../../types';

const PAYMENT_KEYWORDS = ['thanh toán', 'chuyển tiền', 'nạp tiền', 'thanh toan', 'payment', 'chuyen khoan'];
const BANK_TRANSFER_KEYWORDS = ['tài khoản', 'số tk', 'stk', 'account', 'ngân hàng', 'bank'];
const DANGEROUS_DOMAINS = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top'];

export function analyzeQrContent(qrContent: string): {
  isSuspicious: boolean;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  signals: string[];
  recommendations: string;
} {
  const signals: string[] = [];
  let isSuspicious = false;
  let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

  const lower = qrContent.toLowerCase();

  const isPaymentQR = PAYMENT_KEYWORDS.some((k) => lower.includes(k));
  const isBankTransfer = BANK_TRANSFER_KEYWORDS.some((k) => lower.includes(k));
  const hasSuspiciousDomain = DANGEROUS_DOMAINS.some((d) => lower.includes(d));

  if (isPaymentQR || isBankTransfer) {
    signals.push('QR chứa thông tin thanh toán hoặc chuyển khoản');
    riskLevel = 'MEDIUM';
    isSuspicious = true;
  }

  if (hasSuspiciousDomain) {
    signals.push('QR dẫn đến domain đáng ngờ');
    riskLevel = 'HIGH';
    isSuspicious = true;
  }

  const urlMatch = lower.match(
    /https?:\/\/[^\s,;]+/,
  );
  if (urlMatch && !lower.includes('vcb.com.vn') && !lower.includes('bidv.com.vn')) {
    const url = urlMatch[0];
    if (isSuspiciousDomain(url)) {
      signals.push(`URL trong QR không phải domain ngân hàng chính thức: ${maskUrl(url)}`);
      riskLevel = 'HIGH';
      isSuspicious = true;
    }
  }

  return {
    isSuspicious,
    riskLevel,
    signals,
    recommendations:
      riskLevel === 'HIGH'
        ? 'Tuyệt đối không quét mã QR này. Đây có thể là bẫy để chiếm tiền của ông/bà.'
        : riskLevel === 'MEDIUM'
          ? 'Kiểm tra kỹ tên người nhận tiền trước khi xác nhận thanh toán.'
          : 'Mã QR này trông an toàn.',
  };
}

function isSuspiciousDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    const knownBanks = ['vcb.com.vn', 'bidv.com.vn', 'techcombank.com.vn', 'agribank.com.vn', 'acb.com.vn'];
    if (knownBanks.some((b) => hostname.includes(b))) return false;
    return DANGEROUS_DOMAINS.some((d) => hostname.endsWith(d));
  } catch {
    return true;
  }
}

function maskUrl(url: string): string {
  try {
    return new URL(url).hostname + '/***';
  } catch {
    return url.slice(0, 25) + '...';
  }
}

export function injectQrAnalysis(extraction: ExtractionResult): ExtractionResult {
  if (!extraction.qr_code_detected || !extraction.qr_code_content) return extraction;
  const qrAnalysis = analyzeQrContent(extraction.qr_code_content);
  return {
    ...extraction,
    asking_for: [...extraction.asking_for, qrAnalysis.isSuspicious ? 'money' : 'none'],
    psychological_tactics: qrAnalysis.isSuspicious
      ? [...new Set([...extraction.psychological_tactics, 'GREED'])]
      : extraction.psychological_tactics,
  };
}
