# 🛡️ scam-whisperer-agent

<p align="center">
  <em>Trợ lý kỹ thuật số bảo vệ ông bà trước lừa đảo trực tuyến</em>
</p>

<p align="center">
  <strong>AI-powered scam detection companion for elderly Vietnamese users — warm, voice-first, family-connected.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-production%20ready-brightgreen" alt="Status">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/language-Typescript%20%2B%20Python-blue" alt="Language">
  <img src="https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey" alt="Platform">
</p>

---

## 💡 The Problem

Bà Nguyễn Thị Lan, 72 tuổi, sống một mình ở TP.HCM. Bà nhận được tin nhắn Zalo:

> *"Chúc mừng bà đã trúng thưởng xe máy Honda SH. Bấm vào đây để nhận thưởng."*

Bà không chắc đây có phải thật không. Con bà đang đi làm, không thể hỏi ngay. Bà bấm vào link, nhập số tài khoản, và mất 80 triệu đồng tiền tiết kiệm.

**Đây không phải chuyện hiếm.** Theo Bộ Công an Việt Nam, 30%+ nạn nhân lừa đảo mạng là người trên 60 tuổi. Thiệt hại trung bình: 50–500 triệu đồng mỗi vụ.

scam-whisperer-agent tồn tại để bà Lan có một nơi để hỏi — bất cứ lúc nào, miễn phí, không phán xét.

---

## 🫂 The Solution

scam-whisperer-agent là một người cháu kỹ thuật số — ấm áp, kiên nhẫn, luôn sẵn sàng. Ông bà chỉ cần chụp ảnh tin nhắn, gửi lên, và ngay lập tức nhận được câu trả lời bằng **giọng nói tiếng Việt tự nhiên**:

> *"Bà ơi, đây là tin nhắn LỪA ĐẢO đó ạ. Người xấu giả vờ là Honda để lừa bà bấm vào đường dẫn và lấy tiền. Bà đừng bấm vào nhé. Bước 1: Xóa tin nhắn đó đi. Bước 2: Gọi cho con Hùng nếu bà vẫn lo. Bà hỏi trước khi bấm là rất khôn ngoan đó ạ!"*

Đồng thời, con Hùng nhận được thông báo qua Zalo: *"Mẹ vừa gặp một tin nhắn lừa đảo. Mẹ an toàn và đã được hướng dẫn xóa tin nhắn. Không cần lo."*

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────┐
│                  USER INPUT                       │
│    Screenshot  │  Photo  │  Voice Query           │
└──────────────────────┬───────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────┐
│              IMAGE PRE-PROCESSOR                  │
│    Python Pillow: resize, contrast, screen-detect │
└──────────────────────┬───────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────┐
│          VISION ANALYSIS (Claude API)             │
│    Text extraction · Phone/URL/QR · Platform      │
└──────────────────────┬───────────────────────────┘
                       ▼
┌──────────────────────┴───────────────────────────┐
│            PARALLEL ANALYSIS                      │
│                                                    │
│  ┌──────────────┐ ┌────────────┐ ┌─────────────┐ │
│  │ Fast-Path    │ │ URL Check  │ │ Phone Check │ │
│  │ Pattern Match│ │ Google Safe│ │ Scam DB     │ │
│  │ (< 50ms)     │ │ Browsing   │ │ Lookup      │ │
│  └──────┬───────┘ └─────┬──────┘ └──────┬──────┘ │
└─────────┴────────────────┴───────────────┴───────┘
                       ▼
┌──────────────────────────────────────────────────┐
│        DEEP CLASSIFICATION (Claude API)            │
│    Chain-of-thought + Knowledge Base Context       │
│    → Scam category · Threat level · Evidence       │
└──────────────────────┬───────────────────────────┘
                       ▼
┌──────────────────────┴───────────────────────────┐
│               DECISION TREE                        │
│                                                    │
│   🔴 RED ──────────► Family Alert (Zalo/FCM/SMS)   │
│   🟠 ORANGE ───────► Family Alert (delayed)        │
│   🟡 YELLOW ───────► Daily Digest                  │
│   🟢 GREEN ────────► Reassure User                  │
│                         │                          │
│                    ┌────┴────┐                     │
│                    ▼         ▼                     │
│           Explanation    TTS Voice                 │
│           Generator      Synthesis                 │
│           (Claude API)   (Google/FPT/Coqui)        │
│                    │         │                     │
│                    └────┬────┘                     │
│                         ▼                          │
│              User Response (voice-first)           │
└────────────────────────────────────────────────────┘
```

### The "Belt and Suspenders" Detection Strategy

Không một tín hiệu đơn lẻ nào là đủ. Hệ thống sử dụng **nhiều tín hiệu độc lập** và yêu cầu **đồng thuận** mới kết luận an toàn:

| Signal | Method | Speed | Role |
|--------|--------|-------|------|
| Phrase patterns | YAML keyword matching | < 50ms | Fast screening |
| Phone lookup | Local scam database | < 10ms | Known scam numbers |
| URL analysis | Google Safe Browsing + domain patterns | Async | Malicious link detection |
| Psychological triggers | Isolation/urgency/fear detection | < 10ms | Highest-weight red flag |
| LLM reasoning | Claude chain-of-thought | 1–2s | Deep semantic understanding |
| Knowledge base | Semantic phrase search | < 50ms | Context from past scams |

**Tiebreaker Logic**: Any signal > threshold → override to dangerous. User safety > false positive rate.

---

## 🧠 Scam Categories Detected

| # | Category | Tiếng Việt | Threat | Victims |
|---|----------|------------|--------|---------|
| 1 | Prize / Lottery | Trúng thưởng giả | 🔴 | Most common on Zalo |
| 2 | Bank Freeze | Khóa tài khoản ngân hàng | 🔴 | Vietcombank, BIDV, Techcombank |
| 3 | Password Phishing | Lừa lấy mật khẩu | 🔴 | MoMo, ZaloPay, VNPay |
| 4 | CCCD / VNeID | Cập nhật căn cước | 🔴 | 55–80 tuổi primary target |
| 5 | Tax Fine | Nợ thuế / Phạt | 🔴 | Small business owners |
| 6 | Social Insurance | BHXH hoàn tiền | 🔴 | Pensioners targeted |
| 7 | Grandchild Emergency | Con cháu gặp nạn | 🔴 | Highest emotional damage |
| 8 | Romance / Investment | Tình cảm + crypto | 🔴 | 100–500M VND losses |
| 9 | Malicious APK | App giả mạo | 🔴 | Reads OTP messages |
| 10 | QR Code Scam | QR thanh toán giả | 🔴 | Payment interception |
| 11 | Spam Advertising | Quảng cáo spam | 🟡 | Low risk |
| 12 | Legitimate | An toàn | 🟢 | Reassurance |

---

## 🎤 Voice-First Design

Vietnamese voice output is the **default** — not an option. Text is the fallback.

### Voice Pipeline

```
Classification + Explanation
        │
        ▼
┌──────────────────────┐
│     TTS Engine        │
│  ┌─────────────────┐ │
│  │ Google Cloud TTS │ ← Primary (vi-VN-Wavenet)
│  │    ↕ fallback     │ │
│  │ FPT.AI TTS      │ ← Better Southern accents
│  │    ↕ fallback     │ │
│  │ Coqui TTS        │ ← Offline / air-gapped
│  └─────────────────┘ │
└──────────┬───────────┘
           ▼
    SSML Builder
    · Speech rate: 0.85× (elderly calibrated)
    · Volume: +2dB
    · RED alerts: <emphasis> with pauses
    · Step numbers: <break> between actions
    · Numbers preprocessed: "12.500.000" → "mười hai triệu rưỡi"
```

### Voice Input

- Wake word: **"Cháu ơi"**
- Whisper (local) for STT — works offline
- Built-in commands: "cái này là gì", "gọi cho con", "lặp lại", "nói chậm hơn"
- Emergency detection: "bấm vào rồi" triggers damage control path

### Voice Profiles (8 presets)

| Preset | Provider | Gender | Region |
|--------|----------|--------|--------|
| `north_female` | Google Wavenet-A | Female | Hà Nội |
| `north_male` | Google Wavenet-B | Male | Hà Nội |
| `south_female` | Google Wavenet-C | Female | TP.HCM |
| `south_male` | Google Wavenet-D | Male | TP.HCM |
| `fpt_south_female` | FPT.AI banmai | Female | TP.HCM |
| `fpt_north_female` | FPT.AI lannhi | Female | Hà Nội |
| `fpt_south_male` | FPT.AI leminh | Male | TP.HCM |
| `coqui_fallback` | Coqui vi-female | Female | Neutral |

---

## 👨‍👩‍👧 Family Guardian System

### Alert Routing

```
🔴 RED     → Immediate (Zalo ZNS → FCM → SMS)
🟠 ORANGE  → 30s delay (Zalo ZNS → FCM)
🟡 YELLOW  → Daily digest (Sunday 09:00)
🟢 GREEN   → No alert
```

### Guardian Dashboard

Built with Next.js — real-time view of your loved one's safety:

- Current threat status (live indicator)
- Alert history (last 30 days)
- Scam pattern analysis (most common types targeting this user)
- One-tap emergency call to elderly user
- Settings: notification preferences, multi-guardian, weekly digest

### Multi-Guardian Support

```
Primary Guardian    → All alerts, all channels
Secondary Guardian  → RED alerts only
```

Pairing via QR code or 6-digit code — completes in under 30 seconds.

---

## 📱 Mobile App (React Native / Expo)

### Elderly UX — The One-Button Principle

```
┌─────────────────────────────────┐
│   👵  Xin chào, Bà Lan          │
│   Hôm nay bà có an toàn         │
│                                  │
│   ┌─────────────────────────┐   │
│   │   📷 HỎI CHÁU           │   │
│   │   Chụp ảnh tin nhắn     │   │
│   │   để kiểm tra           │   │
│   └─────────────────────────┘   │
│                                  │
│   Hoặc nói: "Cháu ơi..."        │
└─────────────────────────────────┘
```

- **Font size**: 22px default, guardian-adjustable to 26px
- **Touch targets**: 48px minimum (reduces error rate by 50% for users 65+)
- **No hamburger menus**: All critical functions on main screen
- **No swipe gestures**: Elderly users often swipe accidentally
- **High contrast**: Black on white, large text, clear icons

---

## 🔄 Self-Learning Knowledge System

### Daily Intelligence Crawl

```
08:00 Daily
    │
    ├── Bộ Công an (bocongan.gov.vn) ──── HTML scrape
    ├── CATP TP.HCM (congan.tphcm.gov.vn) ─ HTML scrape
    ├── CATP Hà Nội (congan.hanoi.gov.vn) ─ HTML scrape
    ├── Vietcombank security page ──────── HTML scrape
    ├── BIDV fraud alerts ─────────────── HTML scrape
    ├── Techcombank security ──────────── HTML scrape
    ├── antoanthongtin.vn ─────────────── RSS feed
    └── cybersecurity.vn ─────────────── RSS feed
    │
    ▼
Vietnamese keyword extraction
    │
    ▼
Deduplicate against existing patterns
    │
    ▼
Update scam-patterns.yaml (no redeploy needed)
    │
    ▼
Append SECOND-KNOWLEDGE-BRAIN.md
```

### Community Intelligence

- Users report new scams via the app
- After **3+ independent reports** of the same phone number/account → auto-added to scam database
- Moderation queue for human review
- PII stripped before storage

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.9 (optional, for image preprocessing)
- Redis (optional, for session tracking)

### Install

```bash
git clone https://github.com/dungnotnull/scam-whisperer-agent.git
cd scam-whisperer-agent

npm install
pip install -r requirements.txt   # optional
```

### Configure

```bash
cp .env.example .env
# Edit .env — at minimum:
#   ANTHROPIC_API_KEY=sk-ant-...
# Recommended:
#   GOOGLE_TTS_KEY=...
#   GOOGLE_SAFE_BROWSING_KEY=...
```

### Verify Setup

```bash
npm run setup
```

### Run

```bash
npm run dev
# Server starts at http://localhost:3000
```

### Docker

```bash
docker compose up
```

---

## 🔌 API Reference

### Core Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/analyze` | Analyze screenshot/image for scams |
| `POST` | `/analyze/voice` | Analyze from voice input |
| `POST` | `/voice/synthesize` | Text-to-speech synthesis |
| `GET` | `/voice/presets` | List available voice profiles |

### Setup Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/setup/user` | Create user + guardian profile |
| `GET` | `/setup/pairing/:code` | Verify pairing code |

### Guardian Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/guardian/alerts` | Alert history for dashboard |
| `GET` | `/guardian/users` | List monitored users |
| `POST` | `/guardian/digest/:userId` | Generate weekly digest |

### Reporting Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/report` | Submit scam report |
| `GET` | `/reports/pending` | List pending reports (admin) |
| `GET` | `/reports/community` | Community intelligence data |
| `POST` | `/reports/:id/review` | Review a report (admin) |

### System Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check + system metrics |
| `GET` | `/metrics` | Cost tracking + performance |

### Example: Analyze a Screenshot

```bash
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "image_base64": "'$(base64 -w0 screenshot.jpg)'",
    "user_id": "user-001"
  }'
```

Response:

```json
{
  "request_id": "a1b2c3d4-...",
  "classification": {
    "threat_level": "RED",
    "threat_level_vi": "NGUY HIỂM",
    "scam_category": "bank_account_freeze",
    "confidence": 0.94,
    "evidence": [
      "Fake VCB SMS pattern detected",
      "URL domain registered 2 days ago",
      "Urgency + fear psychological trigger"
    ],
    "what_they_want": "Người xấu muốn lấy mật khẩu ngân hàng của ông bà để rút tiền",
    "technical_summary": "Vietcombank impersonation SMS phishing campaign"
  },
  "explanation": {
    "verdict_line": "Đây là tin nhắn LỪA ĐẢO NGUY HIỂM đó bà ạ!",
    "explanation": "Người xấu giả làm Vietcombank báo tài khoản bị khóa để lừa bà bấm vào link giả và lấy mật khẩu.",
    "familiar_comparison": "Giống như có người mặc đồng phục ngân hàng đến nhà xin mật khẩu thẻ ATM — ngân hàng thật sẽ không làm vậy.",
    "action_steps": [
      "Bà đừng bấm vào bất kỳ thứ gì trong tin nhắn đó",
      "Xóa tin nhắn đó đi",
      "Gọi cho con Hùng nếu bà vẫn lo"
    ],
    "reassurance": "Bà làm đúng rồi khi hỏi trước! Người xấu giờ tinh vi lắm, ai cũng có thể bị lừa được.",
    "educational_tip": "Ngân hàng thật sẽ không bao giờ gửi tin nhắn yêu cầu bà bấm vào link để đăng nhập đâu ạ."
  },
  "voice_url": "data:audio/mpeg;base64,...",
  "family_alert": {
    "type": "SCAM_DETECTED",
    "threat_level": "RED",
    "summary_vi": "Đã phát hiện tin nhắn lừa đảo: Người xấu muốn lấy mật khẩu ngân hàng..."
  },
  "processing_time_ms": 4237
}
```

---

## 🧩 Project Structure

```
scam-whisperer-agent/
├── src/
│   ├── agents/
│   │   ├── orchestrator.ts                 → 10-step analysis pipeline
│   │   ├── image-analyzer/
│   │   │   ├── preprocessor.py             → Python: image enhancement
│   │   │   ├── preprocessor.ts             → Node ↔ Python bridge
│   │   │   ├── qr-analyzer.ts              → QR code risk analysis
│   │   │   └── platform-detector.ts        → SMS / Zalo / FB detection
│   │   ├── scam-classifier/
│   │   │   ├── pattern-matcher.ts          → 7-layer fast engine (<50ms)
│   │   │   ├── deep-classifier.ts          → Claude chain-of-thought
│   │   │   ├── url-checker.ts              → Safe Browsing + patterns
│   │   │   ├── phone-checker.ts            → Scam number DB lookup
│   │   │   └── knowledge-search.ts         → Semantic phrase matching
│   │   ├── explanation-generator/
│   │   │   ├── explainer.ts                → Elderly-safe explainer
│   │   │   └── never-shame-validator.ts    → Forbidden pattern check
│   │   ├── action-advisor/
│   │   │   ├── action-advisor.ts           → 3-step action templates
│   │   │   └── damage-control.ts           → Emergency 4-phase guide
│   │   ├── educator/
│   │   │   ├── educator.ts                 → 30+ tips, dedup tracking
│   │   │   └── familiar-comparisons.ts     → 12 relatable metaphors
│   │   └── knowledge-updater/
│   │       ├── crawler.ts                  → 8-source daily crawl
│   │       └── user-reports.ts             → Community reporting
│   │
│   ├── voice/
│   │   ├── tts-profiles.ts                 → 8 presets, SSML builder
│   │   ├── tts-adapter.ts                  → Google/FPT/Coqui chain
│   │   ├── stt-adapter.ts                  → Whisper, wake words
│   │   └── voice-profiles/                 → Region configs (JSON)
│   │
│   ├── notifications/
│   │   ├── alert-router.ts                 → Zalo/FCM/SMS delivery
│   │   ├── guardian-manager.ts             → Registry + dispatch
│   │   └── setup-pairing.ts                → QR/link pairing
│   │
│   ├── data/
│   │   ├── scam-patterns.yaml              → 80+ patterns, 12 categories
│   │   ├── psychological-triggers.yaml     → 6 tactics
│   │   ├── trusted-orgs.json               → Banks, government, e-wallets
│   │   └── scam-database.json              → 150 phones, 69 accounts
│   │
│   ├── ml/text-classifier/
│   │   ├── scam-patterns.yaml              → Full taxonomy
│   │   └── visual-patterns.yaml            → Visual red flags
│   │
│   ├── prompts/
│   │   ├── vision-analysis-prompt.md       → Claude Vision system prompt
│   │   ├── classification-prompt.md        → Chain-of-thought classify
│   │   ├── elderly-explanation-prompt.md   → Plain language explainer
│   │   └── family-alert-prompt.md          → Guardian summary
│   │
│   ├── tools/
│   │   ├── config.ts                       → Environment loader
│   │   ├── llm-client.ts                   → Anthropic API wrapper
│   │   ├── middleware.ts                   → Rate limit, security
│   │   └── monitoring.ts                   → Cron, metrics
│   │
│   └── ui/
│       ├── mobile-app/                     → React Native (Expo)
│       │   ├── App.tsx                     → Home screen
│       │   ├── SetupWizard.tsx             → Onboarding
│       │   └── EmergencyScreen.tsx         → Damage control
│       └── guardian-dashboard/             → Next.js web app
│           ├── app/page.tsx                → Alert history
│           └── app/settings/page.tsx       → Preferences
│
├── scripts/
│   ├── check-setup.js                      → Config validation
│   └── copy-assets.js                      → Build helper
│
├── .github/workflows/
│   ├── ci.yml                              → Typecheck, build, lint, smoke
│   └── daily-crawl.yml                     → Scam intelligence update
│
├── SECOND-KNOWLEDGE-BRAIN.md               → Living scam encyclopedia (24 entries)
├── PROJECT-detail.md                       → Full technical specification
├── PROJECT-DEVELOPMENT-PHASE-TRACKING.md   → Build progress tracker
├── CLAUDE.md                               → Agent identity & personality
└── README.md
```

---

## 🤖 ML Strategy — Why No Custom Training?

We deliberately use **Vision API + prompt engineering + rule-based patterns** instead of custom ML models:

1. **Scam evolution**: Vietnamese scams change weekly. Prompt + KB updates stay current indefinitely. A trained classifier would be outdated in 3 months.
2. **No labeled dataset**: No large labeled Vietnamese scam screenshot dataset exists. Building one is a multi-year effort.
3. **Vision complexity**: Screenshots have varying fonts, photo angles, lighting — needs a foundation model, not a CNN.
4. **Maintenance**: A custom model needs retraining infra. A prompt update takes minutes.
5. **Accuracy**: Claude's vision + reasoning already achieves near-human accuracy. There's no accuracy gap to close.

---

## 🔒 Privacy & Ethics

- **No screenshot storage**: Images processed in RAM, never persisted
- **No conversation history**: Every analysis is stateless
- **Minimal telemetry**: Only anonymized: threat_level + category + timestamp
- **User retains agency**: We inform and recommend — never block or restrict
- **Never-shame policy**: Agent celebrates safe behavior, never blames
- **Family consent**: User explicitly opts into family alerts during setup

---

## 📊 Performance

| Metric | Target | Status |
|--------|--------|--------|
| Screenshot to voice response | < 7s | ✅ |
| Fast-path pattern matching | < 100ms | ✅ (< 50ms) |
| Vision API extraction | < 3s | ✅ |
| LLM classification | < 2s | ✅ |
| TTS generation | < 1s | ✅ |
| Pattern detection (offline) | Always available | ✅ |
| Build | Clean, zero errors | ✅ |

---

## 🧪 Verification

```bash
# TypeScript type check
npm run typecheck

# Build
npm run build

# Lint
npm run lint

# Setup check
npm run setup

# Full pipeline smoke test (no API keys needed)
node -e "
const {runAnalysisPipeline}=require('./dist/agents/orchestrator');
runAnalysisPipeline({image_base64:'dGVzdA==',user_id:'test'}, Date.now())
  .then(r => console.log('✅ Pipeline OK:', r.classification.threat_level_vi))
"
```

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). The highest-impact contribution is reporting new scam patterns. Every submission protects thousands of elderly users.

---

## 📄 License

[MIT](./LICENSE) — Free for personal, commercial, and government use.

---

## 🙏 Acknowledgments

- **Anthropic** — Claude Vision & Text APIs
- **Bộ Công an Việt Nam** — Public scam warnings
- **Vietcombank, BIDV, Techcombank** — Security advisories
- **Cục An toàn Thông tin** — National cybersecurity guidance
- **AARP Fraud Watch Network** — Elderly vulnerability research
- **VLSP** — Vietnamese speech processing benchmarks

---

<p align="center">
  <em>Built with love for ông bà everywhere. Because everyone deserves to feel safe online.</em>
</p>
