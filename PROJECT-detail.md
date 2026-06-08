# PROJECT-detail.md — scam-whisperer-agent

**Full Technical Specification**
Version: 1.0.0 | Last Updated: 2025-06
Status: Pre-Development → Design Finalized

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement — The Human Stakes](#2-problem-statement--the-human-stakes)
3. [Solution Architecture](#3-solution-architecture)
4. [Scam Taxonomy — Vietnamese Context](#4-scam-taxonomy--vietnamese-context)
5. [Component Specifications](#5-component-specifications)
6. [Vision Analysis Pipeline](#6-vision-analysis-pipeline)
7. [Voice Pipeline — TTS & STT](#7-voice-pipeline--tts--stt)
8. [Family Guardian System](#8-family-guardian-system)
9. [Explanation Language Design](#9-explanation-language-design)
10. [Self-Learning Knowledge System](#10-self-learning-knowledge-system)
11. [Mobile App Design](#11-mobile-app-design)
12. [Data Flow (E2E)](#12-data-flow-e2e)
13. [Privacy & Ethical Design](#13-privacy--ethical-design)
14. [Performance Targets](#14-performance-targets)
15. [Risks & Mitigations](#15-risks--mitigations)
16. [Success Metrics](#16-success-metrics)

---

## 1. Project Overview

### 1.1 Name & Tagline
**scam-whisperer-agent** — *"Trợ lý kèm cặp và bảo vệ người già trước không gian số"*
The digital companion that watches over grandma and grandpa so they can use their smartphones without fear.

### 1.2 The Emotional Core

This is not a cybersecurity product. This is a **care product** that happens to use cybersecurity techniques.

The design question is never "How do we detect scams?" — it is always "How does a loving grandchild protect their grandparent while making them feel capable and respected?"

Every design decision — vocabulary choice, voice tone, notification strategy, UI layout — is evaluated against this emotional standard.

### 1.3 Target User Profiles

**Primary: The Elderly User (Người dùng chính)**
- Age: 60–85
- Digital literacy: Low to minimal. Can take photos, send messages on Zalo, scroll Facebook.
- Phone: Android mid-range (Samsung A-series, Oppo) or iPhone SE/older
- Pain point: Doesn't know what to trust online. Fears making a mistake. Doesn't want to bother family.
- Key need: Someone to ask "Cháu ơi, cái này có sao không?" at any time of day.

**Secondary: The Family Guardian (Người giám hộ)**
- Age: 30–55
- Role: Adult child or grandchild who set up the app for their parent/grandparent
- Need: Know their elderly relative is safe without having to check in constantly
- Pain point: Can't monitor 24/7; worries every time parent mentions getting a "prize notification"

**Tertiary: The Isolated Elderly (Người cao tuổi sống một mình)**
- Lives alone, no immediate family in same city
- Especially vulnerable — the app IS their safety net
- Design priority: These users need extra care in the alerting system

---

## 2. Problem Statement — The Human Stakes

### 2.1 The Scale of the Problem in Vietnam

Vietnam is experiencing an epidemic of digital fraud targeting elderly citizens:
- Vietcombank, NCB, BIDV report elderly account holders as the most-targeted demographic
- Common loss amounts: 50–500 million VND per incident
- Bộ Công an Vietnam reports: 30%+ of fraud victims are 60+
- Popular tactics: fake bank SMS, fake government CCCD update requests, fake prize notifications, fake grandchild emergency calls

### 2.2 Why Elderly Users Are Systematically Vulnerable

It is NOT because they are less intelligent. It is because:
- **Trust calibration mismatch**: They were socialized when official-looking = trustworthy. Scammers exploit this.
- **Fear of authority**: Fake police/tax messages trigger deep deference learned over lifetime
- **Urgency response**: Scams create time pressure that bypasses deliberate thinking
- **Isolation**: They can't quickly ask a family member before acting
- **No reference class**: They have no mental model for "this type of fake message exists"

### 2.3 Why Existing Solutions Fail Them

| Solution | Why it fails elderly users |
|----------|---------------------------|
| Built-in spam filters | Block calls/SMS but can't explain why; don't handle Zalo/Facebook scams |
| Security apps (Kaspersky etc.) | Interface too complex; English-heavy; technical alerts incomprehensible |
| Family education | "Just be careful" is not actionable; they forget; new scams emerge |
| Bank fraud warnings | Generic, not real-time, not personalized, not image-based |
| Government hotlines | Reactive (after loss), not proactive, not available 24/7 |

### 2.4 The Moment This App Is Designed For

> Bà Nguyễn Thị Lan, 72 tuổi, nhận được tin nhắn Zalo: "Chúc mừng bà đã trúng thưởng xe máy Honda SH. Bấm vào đây để nhận thưởng." Bà không chắc. Con bà đang họp. Bà mở scam-whisperer, chụp ảnh tin nhắn đó lên.
>
> Giọng nói ấm áp cất lên: "Bà ơi, đây là tin nhắn LỪA ĐẢO đó ạ. Người xấu giả vờ là Honda để lừa bà bấm vào đường dẫn và lấy tiền. Bà đừng bấm vào nhé. Bước 1: Xóa tin nhắn đi. Bước 2: Gọi cho con Hùng nếu bà vẫn lo. Bà hỏi trước khi bấm là rất khôn ngoan đó ạ!"
>
> Cùng lúc đó, điện thoại của con Hùng rung lên: "Mẹ vừa gặp một tin nhắn lừa đảo. Mẹ an toàn và đã được hướng dẫn xóa tin nhắn. Không cần lo."

**This is exactly what we are building.**

---

## 3. Solution Architecture

### 3.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                     USER INPUT LAYER                                  │
│  Screenshot  │  Photo  │  Voice Query  │  Shared from Zalo/Messenger  │
└──────────────┬───────────────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────────────────┐
│                    IMAGE ANALYZER                                      │
│  Claude claude-sonnet-4-20250514 Vision API                                    │
│  → Full text extraction (OCR quality, Vietnamese diacritics)          │
│  → Visual element detection (logos, seals, urgency cues)              │
│  → Phone numbers, URLs, QR codes, bank accounts extracted             │
│  → Platform/source identification                                     │
└──────────────┬───────────────────────────────────────────────────────┘
               │  Structured extraction result
┌──────────────▼───────────────────────────────────────────────────────┐
│                 PARALLEL ANALYSIS (< 500ms total)                     │
│                                                                        │
│  ┌──────────────────┐  ┌────────────────┐  ┌──────────────────────┐  │
│  │ Pattern Matcher  │  │  URL Checker   │  │  Phone/Account DB    │  │
│  │ (< 50ms)         │  │  (async)       │  │  Lookup (< 100ms)    │  │
│  │ Keyword patterns │  │ Safe Browsing  │  │  Known scam numbers  │  │
│  │ Regex rules      │  │ VirusTotal API │  │  Known scam accounts │  │
│  └────────┬─────────┘  └───────┬────────┘  └──────────┬───────────┘  │
│           │                    │                        │              │
└───────────┴──────────────┬─────┴────────────────────────┘             │
                           │                                             │
┌──────────────────────────▼──────────────────────────────────────────┐ │
│              SCAM CLASSIFIER (LLM — Claude API)                      │ │
│  Chain-of-thought reasoning:                                         │ │
│  → Which scam category? (from taxonomy)                              │ │
│  → Psychological manipulation tactics present?                       │ │
│  → Threat level: 🔴🟠🟡🟢                                             │ │
│  → Confidence score                                                  │ │
│  → Specific evidence for verdict                                     │ │
└──────────────────────────┬──────────────────────────────────────────┘ │
                           │                                             │
         ┌─────────────────┴────────────────────┐                       │
         │ 🔴 NGUY HIỂM                          │ 🟢 AN TOÀN            │
         ▼                                       ▼                       │
┌────────────────┐                    ┌─────────────────────┐            │
│  FAMILY ALERT  │◄───────────────────│  EXPLANATION GEN.   │◄───────────┘
│  (async, Zalo) │                    │  (LLM — Claude API) │
│  Parallel to   │                    │  Plain Vietnamese   │
│  user response │                    │  Elderly register   │
└────────────────┘                    └─────────┬───────────┘
                                                │
                                    ┌───────────▼────────────┐
                                    │     TTS ENGINE          │
                                    │  Google/FPT.AI/Coqui    │
                                    │  Regional accent        │
                                    │  Slow, warm, clear      │
                                    └───────────┬────────────┘
                                                │
                                    ┌───────────▼────────────┐
                                    │   USER RESPONSE         │
                                    │  Voice (primary)        │
                                    │  Large text (secondary) │
                                    │  Gentle tip at end      │
                                    └────────────────────────┘
```

### 3.2 The "Belt and Suspenders" Detection Strategy

No single signal is enough. The agent uses MULTIPLE independent signals and requires CONSENSUS to clear something as safe:

```
Signal 1: Pattern matching (fast, cheap)
  → keyword match: +suspicious_score
  → URL pattern match: +suspicious_score
  → phone number in scam DB: +suspicious_score

Signal 2: LLM reasoning (smart, expensive)
  → chain-of-thought analysis
  → manipulation tactic detection
  → impersonation analysis

Signal 3: External database (authoritative)
  → Google Safe Browsing: URL malicious?
  → VirusTotal: phone/URL known malicious?
  → National scam database (if available)

Threat Level Assignment:
  Any signal = DANGEROUS → 🔴 (conservative)
  LLM = SUSPICIOUS + Pattern match = SUSPICIOUS → 🟠
  LLM = SUSPICIOUS only → 🟡
  All signals = SAFE → 🟢
```

---

## 4. Scam Taxonomy — Vietnamese Context

### 4.1 Primary Scam Categories

```yaml
# src/ml/text-classifier/scam-patterns.yaml

scam_categories:

  # ─── FINANCIAL FRAUD ─────────────────────────────────────────────────
  prize_lottery:
    display_name: "Thông báo trúng thưởng giả"
    threat_level: RED
    key_phrases:
      - "chúc mừng bạn/ông/bà đã trúng thưởng"
      - "bạn là người may mắn"
      - "nhận ngay phần thưởng"
      - "điền thông tin để nhận thưởng"
      - "xe máy Honda", "iPhone", "tiền mặt 500 triệu"
    impersonated_orgs: ["Honda", "Samsung", "Vietlott", "VCB", "Coca-Cola", "Grab"]
    psychological_tactic: "GREED"
    plain_explanation: "Người xấu giả vờ tặng quà để lừa lấy thông tin hoặc tiền của ông/bà"

  bank_account_freeze:
    display_name: "Giả mạo ngân hàng — Khóa tài khoản"
    threat_level: RED
    key_phrases:
      - "tài khoản của bạn bị tạm khóa"
      - "đăng nhập ngay để xác minh"
      - "giao dịch bất thường"
      - "bấm vào đây để mở khóa"
    impersonated_orgs: ["Vietcombank", "VCB", "BIDV", "Techcombank", "VPBank", "ACB", "Agribank"]
    psychological_tactic: "FEAR"
    plain_explanation: "Ngân hàng thật sẽ KHÔNG BAO GIỜ gửi tin nhắn yêu cầu đăng nhập qua link"

  bank_password_phishing:
    display_name: "Lừa lấy mật khẩu ngân hàng"
    threat_level: RED
    key_phrases:
      - "xác nhận lại mật khẩu"
      - "cập nhật thông tin tài khoản"
      - "nhập OTP để xác minh"
    impersonated_orgs: ["Vietcombank", "BIDV", "Techcombank", "MoMo", "ZaloPay", "VNPay"]
    psychological_tactic: "AUTHORITY + URGENCY"
    plain_explanation: "Không ai được hỏi mật khẩu ngân hàng của bạn, kể cả nhân viên ngân hàng"

  # ─── GOVERNMENT IMPERSONATION ────────────────────────────────────────
  cccd_update:
    display_name: "Giả mạo Công an — Cập nhật CCCD"
    threat_level: RED
    key_phrases:
      - "cập nhật căn cước công dân"
      - "định danh điện tử VneID"
      - "xử phạt nếu không cập nhật"
      - "Cục Cảnh sát QLHC về TTXH"
    impersonated_orgs: ["Bộ Công an", "UBND", "Cảnh sát khu vực", "Cục Cư dân"]
    psychological_tactic: "AUTHORITY + FEAR + URGENCY"
    plain_explanation: "Công an thật không bao giờ nhắn tin yêu cầu cập nhật CCCD"

  tax_fine:
    display_name: "Giả mạo Thuế/Cơ quan nhà nước — Nợ tiền"
    threat_level: RED
    key_phrases:
      - "nợ thuế chưa thanh toán"
      - "bị phạt nếu không nộp ngay"
      - "lệnh bắt giữ"
      - "bị điều tra hình sự"
    impersonated_orgs: ["Tổng cục Thuế", "Cơ quan điều tra", "Viện kiểm sát", "Tòa án"]
    psychological_tactic: "FEAR + AUTHORITY + URGENCY"
    plain_explanation: "Cơ quan nhà nước luôn gửi thông báo qua bưu điện, không qua Zalo hay điện thoại"

  social_insurance:
    display_name: "Giả mạo BHXH — Hoàn tiền/Mất quyền lợi"
    threat_level: RED
    key_phrases:
      - "hoàn tiền bảo hiểm xã hội"
      - "chế độ hưu trí bị điều chỉnh"
      - "cập nhật thông tin để nhận lương hưu"
    impersonated_orgs: ["BHXH", "Bảo hiểm xã hội Việt Nam"]
    psychological_tactic: "GREED + FEAR"
    plain_explanation: "BHXH không gửi tin nhắn về tiền qua số điện thoại cá nhân"

  # ─── EMOTIONAL/RELATIONSHIP SCAMS ────────────────────────────────────
  grandchild_emergency:
    display_name: "Giả vờ là con/cháu đang gặp nạn"
    threat_level: RED
    key_phrases:
      - "con/cháu đang bị tai nạn"
      - "cần tiền gấp"
      - "đừng kể với ai"
      - "mượn tạm ít tiền"
      - "điện thoại hư, đây là số mới"
    psychological_tactic: "FEAR + URGENCY + ISOLATION"
    detection_note: "Often comes as phone call — transcript analysis needed"
    plain_explanation: "Người xấu giả làm con/cháu để lừa tiền. Luôn gọi thẳng số điện thoại cũ của con để xác nhận"

  romance_scam:
    display_name: "Lừa tình cảm — Đầu tư tiền điện tử"
    threat_level: RED
    key_phrases:
      - "đầu tư sinh lời cao"
      - "anh/chị giới thiệu cho em sàn này"
      - "bitcoin", "crypto", "tiền kỹ thuật số"
      - "rút vốn cần đóng phí"
    psychological_tactic: "TRUST + GREED"
    plain_explanation: "Người lạ không bao giờ giúp bạn làm giàu. Lợi nhuận cao = rủi ro mất hết"

  # ─── MALICIOUS LINKS & APPS ──────────────────────────────────────────
  malicious_apk:
    display_name: "Link tải ứng dụng giả mạo"
    threat_level: RED
    key_phrases:
      - "tải về ngay"
      - "cài ứng dụng này"
      - ".apk", "tải app"
    url_patterns:
      - "contains .apk"
      - "not from official app stores"
      - "shortened URL + apk"
    plain_explanation: "Đừng bao giờ tải ứng dụng từ link lạ. Chỉ dùng CH Play hoặc App Store"

  qr_code_scam:
    display_name: "Mã QR giả mạo thanh toán"
    threat_level: RED
    detection: "visual — QR code present + payment context"
    plain_explanation: "Kiểm tra kỹ tên người nhận trước khi quét mã QR thanh toán"

  # ─── LOWER THREAT ────────────────────────────────────────────────────
  spam_advertising:
    display_name: "Quảng cáo spam"
    threat_level: YELLOW
    plain_explanation: "Đây là quảng cáo không mời mà đến. Không nguy hiểm nhưng ông/bà có thể xóa đi"

  legitimate:
    display_name: "Tin nhắn an toàn"
    threat_level: GREEN
    plain_explanation: "Tin nhắn này trông bình thường và an toàn"
```

### 4.2 Psychological Manipulation Tactics Detection

```yaml
psychological_tactics:
  URGENCY:
    phrases: ["ngay bây giờ", "trong 24 giờ", "hết hạn lúc", "khẩn cấp", "ngay lập tức"]
    signal_weight: HIGH
    
  FEAR:
    phrases: ["bị bắt", "phạt tiền", "khóa tài khoản", "điều tra", "bị kiện"]
    signal_weight: HIGH

  AUTHORITY:
    phrases: ["Bộ Công an", "UBND", "ngân hàng", "cơ quan nhà nước", "theo quy định"]
    signal_weight: HIGH

  GREED:
    phrases: ["trúng thưởng", "hoàn tiền", "sinh lời", "miễn phí", "đặc biệt dành cho bạn"]
    signal_weight: MEDIUM

  ISOLATION:
    phrases: ["đừng nói với ai", "giữ bí mật", "chỉ mình bạn biết"]
    signal_weight: CRITICAL  # Strongest red flag — real organizations never ask for secrecy

  TRUST_BUILDING:
    phrases: ["chúng tôi đã làm việc cùng nhau lâu rồi", "bạn bè giới thiệu"]
    signal_weight: MEDIUM
```

---

## 5. Component Specifications

### 5.1 Image Analyzer (`src/agents/image-analyzer/`)

**Input Types:**
- JPEG/PNG/WEBP screenshots (from share menu or camera)
- Photos of physical documents (letters, bills)
- Photos with QR codes
- Audio/video (future: call recording analysis)

**Vision API Call Strategy:**
```typescript
async function analyzeImage(imageBase64: string): Promise<ExtractionResult> {
  // Primary: Claude Vision
  const response = await anthropicClient.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: imageBase64 }
        },
        {
          type: "text",
          text: VISION_ANALYSIS_PROMPT
        }
      ]
    }]
  });

  return parseExtractionJSON(response);
}
```

**Extraction Output Schema:**
```typescript
interface ExtractionResult {
  raw_text: string;                    // All text extracted verbatim
  platform: Platform;                  // 'sms' | 'zalo' | 'facebook' | 'email' | 'paper' | 'unknown'
  phone_numbers: string[];             // +84..., 09..., 03...
  urls: string[];                      // All URLs found
  bank_accounts: string[];             // Bank account numbers
  qr_code_detected: boolean;
  qr_code_content?: string;            // Decoded QR if readable
  impersonated_org?: string;           // Detected fake org name
  logos_detected: string[];            // Logo descriptions
  urgency_visual_cues: string[];       // "red text", "countdown", "CẢNH BÁO stamp"
  asking_for: AskingFor[];             // 'money' | 'personal_info' | 'password' | 'click_link' | 'install_app'
  psychological_tactics: string[];     // URGENCY, FEAR, etc.
  image_quality: 'good' | 'fair' | 'poor';
  language: 'vi' | 'en' | 'mixed';
}
```

**Image Quality Handling:**
- `good`: Full analysis
- `fair`: Extract what's possible, note reduced confidence
- `poor` (blurry, dark): Ask user to retake — "Bà chụp lại rõ hơn được không ạ? Cháu chưa đọc được hết"

### 5.2 Scam Classifier (`src/agents/scam-classifier/`)

**Two-Path Classification:**

**Fast Path (< 100ms) — Pattern Matching:**
```typescript
function fastPathClassify(extraction: ExtractionResult): FastPathResult {
  let suspicionScore = 0;
  const signals: string[] = [];

  // Check phone numbers against scam database
  for (const phone of extraction.phone_numbers) {
    if (SCAM_PHONE_DB.has(normalizePhone(phone))) {
      suspicionScore += 100;  // Known scam number = immediate RED
      signals.push(`Số điện thoại ${maskPhone(phone)} đã bị báo cáo lừa đảo`);
    }
  }

  // Check URLs
  for (const url of extraction.urls) {
    if (isSuspiciousDomain(url)) {
      suspicionScore += 80;
      signals.push(`Đường dẫn ${maskUrl(url)} trông rất đáng ngờ`);
    }
  }

  // Check scam phrases
  for (const [category, patterns] of SCAM_PHRASE_PATTERNS) {
    const matches = patterns.filter(p => extraction.raw_text.includes(p));
    if (matches.length >= 2) {
      suspicionScore += 60;
      signals.push(`Có dấu hiệu "${category}"`);
    }
  }

  // Check isolation tactic (highest weight)
  if (ISOLATION_PHRASES.some(p => extraction.raw_text.includes(p))) {
    suspicionScore += 150;  // "đừng nói với ai" is an extreme red flag
    signals.push("Yêu cầu giữ bí mật — đây là dấu hiệu đặc trưng của lừa đảo");
  }

  return {
    suspicionScore,
    signals,
    requiresLLMAnalysis: suspicionScore < 100 && suspicionScore > 0
  };
}
```

**Deep Path — LLM Analysis:**
```typescript
async function deepAnalyze(
  extraction: ExtractionResult,
  fastPathResult: FastPathResult,
  knowledgeContext: KnowledgeEntry[]
): Promise<ClassificationResult> {

  const prompt = buildClassificationPrompt(extraction, fastPathResult, knowledgeContext);

  const response = await anthropicClient.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 600,
    temperature: 0.1,  // Deterministic for classification
    system: CLASSIFICATION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }]
  });

  return parseClassificationJSON(response.content[0].text);
}
```

**Classification Output:**
```typescript
interface ClassificationResult {
  threat_level: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';
  threat_level_vi: 'NGUY HIỂM' | 'ĐÁ NGỜ' | 'CHÚ Ý' | 'AN TOÀN';
  scam_category?: string;
  confidence: number;           // 0.0 - 1.0
  evidence: string[];           // Specific things that triggered classification
  impersonated_org?: string;
  psychological_tactics: string[];
  what_they_want: string;       // In plain Vietnamese: "họ muốn lấy mật khẩu ngân hàng của ông/bà"
  // Data for report to family
  technical_summary: string;    // More technical, for family guardian
}
```

### 5.3 Explanation Generator (`src/agents/explanation-generator/`)

**Elderly Language Register Rules (enforced in prompt):**

| Technical Term | Elderly-Safe Replacement |
|---------------|-------------------------|
| phishing | "lừa lấy thông tin" |
| malware | "virus trong điện thoại" |
| URL / link | "đường dẫn" |
| OTP | "mã xác nhận một lần" |
| hacker | "kẻ gian trên mạng", "người xấu" |
| scam | "lừa đảo", "trò bẫy" |
| spoofing | "giả mạo" |
| social engineering | "thủ thuật tâm lý để lừa" |
| phishing link | "đường dẫn bẫy" |
| bank account | "số tài khoản" |
| cryptocurrency | "tiền ảo" |

**Response Template Structure:**
```
[VERDICT LINE] — "Đây là tin nhắn LỪA ĐẢO đó ạ, {form_of_address}!"

[EXPLANATION — 2 sentences max]
[Sentence 1: WHO is behind this] "Người xấu giả vờ là {org} để..."
[Sentence 2: WHAT they actually want] "Thực ra họ muốn {bad_thing}"

[FAMILIAR COMPARISON — optional but powerful]
"Giống như có người đứng ở chợ giả làm nhân viên ngân hàng để xin mật khẩu của mình vậy"

[3 ACTION STEPS]
"Bước 1: {simple action}"
"Bước 2: {simple action}"  
"Bước 3: {optional — contact family}"

[REASSURANCE + EDUCATION]
"[Tên] làm đúng rồi khi hỏi trước! {one educational fact about this scam type}"
```

**Familiar Comparison Library** (make abstract threats concrete):
```typescript
const FAMILIAR_COMPARISONS = {
  bank_phishing: "Giống như có người mặc đồng phục ngân hàng đến nhà xin mật khẩu thẻ ATM — ngân hàng thật sẽ không làm vậy",
  prize_scam: "Giống như người lạ ngoài đường nói bạn trúng xe hơi — của ngon không bao giờ đến dễ vậy",
  cccd_scam: "Cũng như ngày xưa có kẻ giả cảnh sát đến nhà — công an thật sẽ đến trực tiếp, không nhắn tin",
  urgency_tactic: "Khi người ta nói 'phải làm ngay bây giờ' — đó thường là dấu hiệu của lừa đảo. Việc thật không cần gấp vậy",
  isolation_request: "Khi ai đó nói 'đừng kể với con cháu' — đó chắc chắn là lừa đảo rồi"
};
```

### 5.4 Action Advisor (`src/agents/action-advisor/`)

**Action Templates by Category:**

```typescript
const ACTION_TEMPLATES: Record<ThreatLevel, ActionSet> = {
  RED: {
    immediate: [
      "Bước 1: Đừng bấm vào bất kỳ thứ gì trong tin nhắn đó",
      "Bước 2: Xóa tin nhắn đó đi",
      "Bước 3: Gọi cho {family_contact_name} nếu {form_of_address} vẫn lo"
    ],
    if_already_clicked: [
      "Bước 1: Tắt wifi và dữ liệu điện thoại ngay",
      "Bước 2: Gọi cho {family_contact_name} ngay bây giờ",
      "Bước 3: Đổi mật khẩu ngân hàng qua điện thoại của người thân"
    ]
  },
  ORANGE: {
    immediate: [
      "Bước 1: Chưa bấm vào gì nhé",
      "Bước 2: Gọi thẳng đến {impersonated_org} qua số chính thức để xác nhận",
      "Bước 3: Kể lại cho {family_contact_name} nghe"
    ]
  },
  YELLOW: {
    immediate: [
      "Đây trông có vẻ ổn nhưng {form_of_address} cứ cẩn thận nhé",
      "Nếu không chắc, {form_of_address} cứ hỏi {family_contact_name} trước"
    ]
  },
  GREEN: {
    immediate: [
      "Tin nhắn này an toàn, {form_of_address} không cần lo"
    ]
  }
};
```

**"Already Clicked" Flow:**
Special high-urgency path when user indicates they already interacted with scam content:
```
User: "rồi bấm vào rồi cháu ơi"
→ Skip explanation, go straight to damage control:
1. Turn off WiFi NOW (prevent further data extraction)
2. Call family contact NOW
3. Call bank hotline to freeze account
4. Do NOT install anything asked
→ Alert family as CRITICAL (not just informational)
```

### 5.5 Family Alerter (`src/agents/family-alerter/`)

**Alert Types:**
```typescript
type AlertType = 
  | 'SCAM_DETECTED'           // User found a scam — handled safely
  | 'SCAM_INTERACTED'         // User already clicked/responded — urgent
  | 'POSSIBLE_LOSS'           // User may have sent money — very urgent
  | 'WEEKLY_DIGEST'           // Weekly summary report
  | 'EDUCATIONAL_MILESTONE';  // User correctly identified a scam themselves
```

**Alert Content for Family:**
```typescript
interface FamilyAlert {
  type: AlertType;
  timestamp: Date;
  elderly_user_name: string;
  threat_level: 'RED' | 'ORANGE' | 'GREEN';
  
  // Human-readable for family
  summary_vi: string;       // "Mẹ vừa nhận được tin nhắn giả mạo Vietcombank"
  action_taken: string;     // "Mẹ đã được hướng dẫn xóa tin nhắn"
  family_action_needed: string | null;  // null if safe, or what family should do
  
  // Technical detail for family (they ARE tech-literate)
  scam_category: string;
  impersonated_org?: string;
  phone_numbers: string[];  // Masked: "090*****23"
  urls: string[];           // Masked for safety
  
  // Thumbnail of the analyzed image (low-res, anonymized)
  image_thumbnail?: string;
}
```

**Delivery Channels:**
1. **Zalo ZNS** (Zalo Notification Service) — primary; highest reach in Vietnam
2. **FCM Push Notification** — if family guardian has the companion app
3. **SMS** — fallback for critical alerts only (cost consideration)

**Alert Timing:**
- 🔴 RED: Send immediately, parallel to user response
- 🟠 ORANGE: Send within 30 seconds
- 🟡 YELLOW: Batch into daily digest
- 🟢 GREEN: No alert
- Weekly Digest: Every Sunday 09:00 (configurable)

**Family Guardian Response:**
```
Family can reply to alert:
→ "Mẹ biết rồi, cảm ơn" → App shows on elderly user's phone: "Con Hùng nhắn: Mẹ ơi con biết rồi, mẹ cứ yên tâm nhé"
→ "Gọi cho mẹ ngay" → Initiates call via app
→ "Cần thêm thông tin" → Full analysis report sent to family
```

---

## 6. Vision Analysis Pipeline

### 6.1 Multi-Image Support

Users often share a conversation thread (multiple messages). The agent handles:
- **Single screenshot**: Standard analysis
- **Multiple screenshots in sequence**: Combine for context (scam may span multiple messages)
- **Photo of phone screen**: Pre-process for glare/angle correction before OCR

### 6.2 Pre-processing Before Vision API

```python
# src/agents/image-analyzer/preprocessor.py

from PIL import Image, ImageEnhance, ImageFilter
import numpy as np

def preprocess_screenshot(image_bytes: bytes) -> bytes:
    """Optimize image for text extraction quality."""
    img = Image.open(io.BytesIO(image_bytes))
    
    # 1. Resize if too large (Vision API works well at 1080p)
    max_size = (1080, 1920)
    img.thumbnail(max_size, Image.LANCZOS)
    
    # 2. Enhance contrast for screenshots with poor lighting
    if is_photo_of_screen(img):  # vs native screenshot
        img = ImageEnhance.Contrast(img).enhance(1.5)
        img = ImageEnhance.Sharpness(img).enhance(1.3)
    
    # 3. Convert to grayscale if contrast is issue
    # (preserves text readability for OCR while reducing noise)
    
    return image_to_bytes(img, format='JPEG', quality=90)

def is_photo_of_screen(img: Image) -> bool:
    """Detect if this is a photo taken of a screen (vs native screenshot)."""
    # Heuristics: aspect ratio unusual, slight barrel distortion, moiré pattern
    ...
```

### 6.3 QR Code Analysis

```typescript
// When QR code detected in image:
// 1. Vision API describes QR code's destination
// 2. Extract URL from description
// 3. Check URL against Safe Browsing API
// 4. If QR leads to payment: warn about QR payment fraud specifically

const QR_WARNING = "Ông/bà kiểm tra kỹ tên người nhận khi quét mã này nhé. Người xấu hay đổi mã QR thanh toán để chiếm tiền.";
```

---

## 7. Voice Pipeline — TTS & STT

### 7.1 TTS Provider Selection

**Primary: Google Cloud TTS (vi-VN-Wavenet)**
```typescript
const TTS_VOICES = {
  north_female: { name: 'vi-VN-Wavenet-A', gender: 'FEMALE' },
  north_male:   { name: 'vi-VN-Wavenet-B', gender: 'MALE' },
  south_female: { name: 'vi-VN-Wavenet-C', gender: 'FEMALE' },
  south_male:   { name: 'vi-VN-Wavenet-D', gender: 'MALE' },
};

const TTS_SETTINGS_ELDERLY = {
  speakingRate: 0.85,     // Slower than default
  pitch: 0.0,             // Neutral pitch
  volumeGainDb: 2.0,      // Slightly louder
  effectsProfileId: ['headphone-class-device'],
};
```

**Secondary: FPT.AI TTS**
- Vietnamese company; more authentic regional accents
- API: `api.fpt.ai/hmi/tts/v5`
- Supports: northern, southern, male/female voices
- Fallback when Google TTS is unavailable

**Offline: Coqui TTS** (fully local)
- For elderly users in areas with poor connectivity
- Lower quality but functional
- Pre-download voice model on app install

### 7.2 Voice Output Design Rules

**Tone calibration by threat level:**
```
🔴 NGUY HIỂM: Slightly more emphatic opening, then calm and reassuring
  "Bà ơi! [brief pause] Đây là tin nhắn LỪA ĐẢO đó bà ạ..."
  [NOT panicked, NOT alarming — firm and caring]

🟢 AN TOÀN: Warm and reassuring
  "Bà ơi, tin nhắn này an toàn, bà không cần lo gì cả..."
```

**SSML Markup for Natural Vietnamese Speech:**
```xml
<speak>
  <prosody rate="slow" volume="loud">
    <emphasis level="strong">Đây là tin nhắn lừa đảo</emphasis>
    <break time="300ms"/>
    đó bà ạ.
  </prosody>
  <break time="500ms"/>
  Người xấu giả vờ là Vietcombank để lừa bà bấm vào đường dẫn và lấy mật khẩu.
  <break time="500ms"/>
  Bà đừng bấm vào nhé.
  <break time="300ms"/>
  Bước một: <prosody rate="x-slow">Xóa tin nhắn đó đi.</prosody>
</speak>
```

### 7.3 Voice Input (STT)

```typescript
// Elderly users can speak their question:
// "Cháu ơi, cái này con gửi hay người lạ gửi vậy?"
// → Transcribe → analyze intent → appropriate response

// Voice commands recognized:
const VOICE_COMMANDS = {
  "cái này là gì": "analyze_current_screenshot",
  "đây có lừa đảo không": "analyze_current_screenshot",
  "gọi cho con": "call_primary_guardian",
  "lặp lại": "repeat_last_response",
  "nói chậm hơn": "repeat_slower",
  "cháu ơi": "wake_word",
};
```

---

## 8. Family Guardian System

### 8.1 Guardian Setup Flow

```
1. Adult child installs companion app on THEIR phone
2. Opens elderly parent's phone, installs main app
3. Setup wizard on elderly phone:
   - "Tên ông/bà là gì?" (for personalized responses)
   - "Gọi ông/bà là gì? (ông/bà/thầy/cô/bác/cụ)"
   - "Vùng miền ông/bà ở đâu?" (for voice accent)
   - "Ai là người thân đầu tiên liên lạc khi có chuyện?"
     → Links to guardian's contact
4. Guardian approves link on their phone
5. Done — elderly user never needs to configure anything again
```

### 8.2 Guardian Dashboard Features

```
Web dashboard at: https://app.scamwhisperer.vn/guardian

Features:
├── Real-time: Current threat level of parent/grandparent (green/orange/red)
├── History: All analyzed screenshots + verdicts (last 30 days)
├── Pattern: Most common scam types targeting this user
├── Education: What topics has the agent explained? What's still needed?
├── Settings: 
│   ├── Alert preferences (immediate vs digest)
│   ├── Family member access (add siblings, other children)
│   └── Trusted senders (whitelist known contacts)
└── Emergency: One-tap call to elderly user
```

### 8.3 Multi-Guardian Support

```typescript
// Multiple family members can be guardians with different permissions
interface Guardian {
  name: string;
  phone: string;
  role: 'PRIMARY' | 'SECONDARY';
  // PRIMARY: receives all alerts
  // SECONDARY: receives only RED alerts
  notification_preferences: {
    red_alerts: boolean;     // Always true for PRIMARY
    orange_alerts: boolean;
    weekly_digest: boolean;
    channel: 'zalo' | 'sms' | 'push' | 'email';
  };
}
```

---

## 9. Explanation Language Design

### 9.1 The "Grandchild Test"

Every piece of user-facing text must pass this test:
> "Would you say these exact words to your 75-year-old grandmother?"

If the answer is no — rewrite it.

### 9.2 Regional Dialect Adaptation

```typescript
const REGIONAL_VOCABULARY = {
  north: {
    form_of_address_default: "ông/bà",
    "good": "tốt", "yes": "vâng", "very": "rất",
    "don't": "không",
  },
  south: {
    form_of_address_default: "ông/bà",
    "good": "tốt", "yes": "dạ", "very": "lắm",
    "don't": "đừng",
    // Southern Vietnamese: "hổng" = "không", "thiệt" = "thật"
    // Accept these in input; respond in standard Vietnamese
  },
  central: {
    form_of_address_default: "ông/bà",
    // Huế/Đà Nẵng accent: agent responds in neutral Vietnamese
    // but uses regionally familiar cultural references
  }
};
```

### 9.3 Cognitive Load Design

**For elderly users with possible early cognitive decline:**
- Sentence length: maximum 15 words
- Never nest clauses: "Bạn cần làm X vì Y và Z" → break into 2 sentences
- Action steps: numbered, one action per step
- No conditional language in action steps: "Nếu X thì làm Y" → just "Làm Y"
- Repetition is OK and welcome: summarize key action at end

### 9.4 The "Never Shame" Policy

**Forbidden response patterns:**
```
❌ "Đây rõ ràng là lừa đảo"  (implies user should have known)
❌ "Cách này rất cũ, ai cũng biết rồi"
❌ "Ông không nên bao giờ bấm vào những thứ này"
❌ "Lần sau nhớ cẩn thận hơn nhé"

✅ "Người xấu giờ này tinh vi lắm, ai cũng có thể bị lừa được"
✅ "Ông làm rất đúng khi hỏi trước khi bấm"
✅ "Những trò này được thiết kế để lừa mọi người, không phải ông không tinh ý đâu"
```

---

## 10. Self-Learning Knowledge System

### 10.1 Knowledge Sources

| Source | Content | Frequency | Method |
|--------|---------|-----------|--------|
| Bộ Công an Vietnam announcements | Official scam warnings | Daily | RSS/web scrape |
| CATP websites (Công an TP.HCM, Hà Nội) | Regional scam reports | Daily | Web scrape |
| Vietcombank/BIDV/ACB security pages | Bank-specific scam warnings | Weekly | Web scrape |
| VNPT/Viettel security bulletins | Telecom scam warnings | Weekly | Web scrape |
| CyberSecurity.vn, antoanthongtin.vn | Vietnamese cybersecurity news | Daily | RSS |
| User reports (crowdsourced) | New scam screenshots reported by users | Continuous | In-app report |
| Interpol/global scam databases | International scam patterns reaching VN | Weekly | API |

### 10.2 Knowledge Entry Format

```markdown
## [2025-06-01] [KB-2025-06-01-SCP-001] [domain:bank_impersonation] Chiến dịch giả mạo VCB tháng 6/2025

**Nguồn**: Bộ Công an — cảnh báo chính thức 01/06/2025
**Mức độ**: 🔴 Nguy hiểm cao
**Số nạn nhân đã biết**: 45+ (Hà Nội và TP.HCM)
**Tổn thất trung bình**: 80-300 triệu VND

### Mô tả
Tin nhắn SMS giả mạo Vietcombank (Brand: VCB), thông báo tài khoản bị khóa do "giao dịch bất thường". 
Yêu cầu bấm vào link: vcb-security-verify.com (domain mới tạo ngày 28/05/2025).

### Đặc điểm nhận dạng
- Số gửi: +84-24-xxxx-xxxx (thường đổi số)
- URL pattern: vcb-*.com, vietcombank-*.net
- Nội dung y hệt SMS thật của VCB nhưng có link
- Trang giả mạo copy giao diện VCB Internet Banking

### Mẫu câu lừa đảo
- "Tài khoản Vietcombank của bạn bị tạm khóa do hoạt động bất thường"
- "Nhấp vào đây để xác minh và mở khóa tài khoản ngay"
- "Giao dịch sẽ bị hủy nếu không xác minh trong 24 giờ"

### Hành động đã biết
- Dẫn đến trang fake giống VCB 99%
- Thu thập: username, password, OTP
- Rút tiền ngay sau khi có OTP

### Cập nhật Pattern Library
- Thêm vào scam-patterns.yaml: "vcb-*.com", "vietcombank-*.net"
- Thêm vào: ["tài khoản bị tạm khóa do hoạt động bất thường"]
```

### 10.3 Pattern Auto-Update Pipeline

```
Crawl new scam report
  ↓
LLM extracts: key phrases, URL patterns, phone patterns, impersonated orgs
  ↓
Validate against existing patterns (dedup)
  ↓
Append to SECOND-KNOWLEDGE-BRAIN.md
  ↓
Update scam-patterns.yaml (add new phrase patterns)
  ↓
Push to live pattern matcher (no redeployment needed)
  ↓
Notify all guardian dashboards: "Cảnh báo mới: Chiến dịch giả mạo VCB đang hoạt động"
```

---

## 11. Mobile App Design

### 11.1 Primary Elderly UX Principles

- **One big button**: "Hỏi Cháu" — the main action. Everything else is secondary.
- **Font size**: Minimum 18px, default 22px. Elderly users should never need to zoom.
- **High contrast**: Black text on white background. Avoid colored text for content.
- **No hamburger menus**: All critical functions accessible from main screen.
- **Touch target size**: Minimum 48px height for all tappable elements.
- **No swipe gestures for critical actions**: Elderly users accidentally swipe. Use explicit buttons.
- **Confirm destructive actions**: "Bà có chắc muốn xóa không?" before deleting.

### 11.2 Main App Flow

```
HOME SCREEN:
┌─────────────────────────────────┐
│   👵  Xin chào, Bà Lan          │
│   Hôm nay bà có an toàn         │
│                                  │
│   ┌─────────────────────────┐   │
│   │   📷 HỎI CHÁU           │   │  ← Giant button (70% of screen)
│   │   Chụp ảnh tin nhắn     │   │
│   │   để kiểm tra           │   │
│   └─────────────────────────┘   │
│                                  │
│   Hoặc nói: "Cháu ơi..."        │  ← Voice alternative
│                                  │
│   📊 7 ngày qua: 3 lừa đảo      │  ← Simple stats
│   đã được phát hiện              │
│                                  │
│   📞 Gọi con Hùng               │  ← Direct call shortcut
└─────────────────────────────────┘
```

### 11.3 Result Screen

```
RESULT SCREEN (after analysis):
┌─────────────────────────────────┐
│                                  │
│   🔴 LỪA ĐẢO NGUY HIỂM         │  ← Large, clear verdict
│                                  │
│   [Agent voice auto-plays]       │  ← Auto-play voice explanation
│   ▶ Nghe lại                     │
│                                  │
│   ─────────────────────────     │
│   Bước 1: Đừng bấm vào          │  ← Large numbered steps
│           tin nhắn đó            │
│                                  │
│   Bước 2: Xóa tin nhắn đi       │
│                                  │
│   Bước 3: Gọi cho con Hùng      │
│           nếu bà vẫn lo          │
│                                  │
│   ─────────────────────────     │
│   💡 Bà biết không?              │  ← Gentle tip
│   Ngân hàng thật không bao       │
│   giờ gửi link qua tin nhắn      │
│                                  │
│   [✓ Xóa tin nhắn đó]           │  ← Action button
│   [📞 Gọi con Hùng]             │
└─────────────────────────────────┘
```

---

## 12. Data Flow (E2E)

### 12.1 Happy Path — Screenshot Analysis

```
User shares screenshot from Zalo
  ↓ (< 200ms)
Image pre-processing (resize, enhance if photo-of-screen)
  ↓
PARALLEL:
  ├── Vision API (Claude) — full image analysis → ExtractionResult (2-3s)
  ├── Fast pattern matching on filename/metadata — instant
  └── (if URL detected) Safe Browsing API check — async

  ↓ (after Vision API returns)
Fast-path pattern matching on extracted text — 50ms
  → Score = 0: still run LLM for confirmation
  → Score > 100: RED immediately, LLM confirms details

  ↓
LLM Classification (Claude) — chain-of-thought — 1-2s
  → ClassificationResult with threat level, evidence, what they want

  ↓
PARALLEL:
  ├── If RED/ORANGE: Family Alert (Zalo ZNS) — async, non-blocking
  └── Explanation Generation (Claude) — 1s

  ↓
TTS Generation (Google TTS) — 0.5-1s
  ↓
Audio plays automatically + visual result shown
  ↓
User interacts: "Nghe lại" / "Gọi con Hùng" / "Xóa tin nhắn"
  ↓
Educational tip shown after 3 seconds
  ↓
Session saved to local log (anonymized)

Total time from screenshot to voice response: 4-7 seconds
```

### 12.2 "Already Clicked" Emergency Path

```
User: "Bấm vào rồi cháu ơi"
  ↓ (< 1 second)
EMERGENCY MODE:
  ├── Skip explanation
  ├── Play urgent but calm voice: "Bà nghe cháu nói đây..."
  ├── Show 3 emergency steps (no reading required — voice guides)
  └── Alert family as CRITICAL — call, not just notification

Emergency steps:
  1. Tắt wifi ngay (with visual guide: show where wifi toggle is)
  2. Đừng làm gì thêm
  3. [Auto-initiates call to primary guardian]
```

---

## 13. Privacy & Ethical Design

### 13.1 Data Principles

- **No screenshot storage**: Images processed in memory (RAM), never written to disk or database
- **No conversation history**: Each analysis is independent; no conversation logs stored
- **Minimal telemetry**: Only anonymized: threat_level + scam_category + timestamp (no content)
- **Family data**: Only summary sent to family, never full image content or personal data from image
- **PDPA compliance**: Complies with Vietnam's Personal Data Protection Decree (Nghị định 13/2023/NĐ-CP)

### 13.2 Consent Design

- Elderly user (or their guardian) explicitly consents to family alerts during setup
- User can disable family alerts at any time (even without guardian's knowledge)
- Clear explanation of what is shared: "Khi có tin nhắn nguy hiểm, cháu sẽ tự động báo cho con Hùng"

### 13.3 Avoiding Paternalism

- The agent INFORMS and RECOMMENDS — it does not BLOCK or RESTRICT
- Elderly users retain full agency: they choose whether to act on recommendations
- The app never deletes messages, never makes calls, never performs actions on behalf of the user WITHOUT explicit user confirmation (except family notifications, which are clearly explained at setup)

### 13.4 Vulnerability-Informed Design

- The app is designed knowing that some users may have early cognitive decline
- Simplicity and repetition are features, not dumbing-down
- If user seems confused (asks same question repeatedly), gently suggest calling family
- No dark patterns — the app's job is to protect users, never to engage them longer than needed

---

## 14. Performance Targets

| Metric | Target |
|--------|--------|
| Time from screenshot to voice response | < 7 seconds |
| Fast-path pattern matching | < 100ms |
| Vision API extraction | < 3 seconds |
| LLM classification | < 2 seconds |
| TTS generation | < 1 second |
| Family alert delivery (Zalo) | < 10 seconds from detection |
| Pattern database lookup (phone/URL) | < 50ms |
| False negative rate (miss a real scam) | < 2% |
| False positive rate (flag safe message) | < 8% (acceptable; safety > convenience) |
| App launch to ready state | < 2 seconds |
| Offline functionality (pattern-only) | Available within 1 second |
| Knowledge base update cycle | < 24 hours for new national scam alert |

---

## 15. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Vision API fails to read blurry phone photo | High | Medium | Pre-processing enhancement; ask user to retake; graceful fallback to pattern-only |
| New scam type not in knowledge base | Medium | High | LLM reasoning catches novel patterns; conservative default (suspicious if unclear) |
| Elderly user panics at 🔴 alert | Medium | Medium | Voice tone calibration; "bình tĩnh nào" opening; family alert reduces isolation |
| False positive: family alerted for safe message | Medium | Low | Orange threshold before family alert; family can dismiss; user trust maintained |
| User has already sent money | Low | Critical | Damage control path with bank freeze steps; family emergency call |
| App too complex for target users | Medium | High | Mandatory elderly user testing (5+ users, 70+) before each release |
| Vietnamese TTS sounds unnatural/robotic | Medium | Medium | A/B test FPT.AI vs Google TTS with elderly user panel |
| Privacy concern: family receives too much info | Low | Medium | Consent-first design; user controls what family sees |
| Scammer evolves to evade patterns | High (ongoing) | Medium | LLM reasoning is pattern-agnostic; weekly KB updates; user reports |

---

## 16. Success Metrics

### Primary Safety KPIs
- [ ] Detection rate ≥ 95% on known scam test set (50+ fixtures)
- [ ] False negative rate ≤ 2% (missing real scams is the critical failure)
- [ ] Zero cases of user following scam instructions after app interaction (user testing)

### User Experience KPIs
- [ ] Elderly user comprehension test: 8/10 users understand the verdict without explanation
- [ ] Task completion: 9/10 elderly test users correctly identify and delete a scam in under 90 seconds
- [ ] User satisfaction: "Cháu giải thích dễ hiểu" rated ≥ 4.5/5 in user survey
- [ ] Voice preference: ≥ 80% of elderly users prefer voice over text output

### Family System KPIs
- [ ] Family alert delivery ≤ 10 seconds for 🔴 threats
- [ ] Guardian satisfaction: "Tôi cảm thấy yên tâm hơn khi mẹ dùng app này" ≥ 4.0/5
- [ ] Weekly digest open rate ≥ 60% (guardians actually read updates)

### Knowledge System KPIs
- [ ] New national scam alert reflected in patterns ≤ 24 hours after publication
- [ ] Knowledge base grows by 5-20 entries per week
- [ ] User-reported scams processed and added to KB within 48 hours

---

*End of PROJECT-detail.md*
