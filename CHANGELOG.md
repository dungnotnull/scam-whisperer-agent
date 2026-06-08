# CHANGELOG.md

Tất cả thay đổi đáng chú ý của **scam-whisperer-agent** được ghi lại ở đây.

---

## [0.1.0] — 2026-06-08

### Added — Initial Release

**Phase 0 — Foundation & Scam Intelligence**
- Node.js/TypeScript project scaffold với Express REST API
- 80+ scam phrase patterns trong 12 danh mục (tiếng Việt)
- 6 psychological trigger patterns (URGENCY, FEAR, AUTHORITY, GREED, ISOLATION, TRUST)
- Cơ sở dữ liệu 9 ngân hàng + 4 cơ quan chính phủ + 4 ví điện tử
- 12 familiar comparisons (so sánh dễ hiểu cho người cao tuổi)
- 4 LLM prompt templates: Vision, Classification, Explanation, Family Alert
- Docker support (Dockerfile + docker-compose.yml với Redis)

**Phase 1 — Core Detection Engine**
- Image analyzer: Python pre-processor + QR analyzer + platform detector
- Fast-path pattern matcher: 7-layer detection engine (<50ms)
- Deep LLM classifier: chain-of-thought + knowledge base semantic search
- Consensus logic: fast-path + LLM + Safe Browsing + phone DB
- URL checker: Google Safe Browsing API + suspicious domain patterns
- Phone checker: scam number database lookup với normalization
- "Already Clicked" emergency path: 4-phase damage control
- 16 API endpoints

**Phase 2 — Voice & Explanation System**
- Elderly-safe explanation generator với "Grandchild Test" validator
- Never-shame validator: chặn 12 forbidden pattern categories
- Regional vocabulary adapter: north/south/central
- TTS engine: Google Cloud → FPT.AI → Coqui fallback chain
- 8 voice presets (north/south/central × male/female)
- SSML builder với threat-level-calibrated emphasis
- Number-to-spoken-Vietnamese preprocessing
- Whisper STT adapter: wake word "Cháu ơi", voice commands
- 30+ educational tips với per-user dedup tracking

**Phase 3 — Family Guardian & Mobile App**
- 3-channel notification: Zalo ZNS → FCM → SMS (Twilio)
- Guardian registry: pairing codes, QR linking, multi-guardian
- Weekly digest report generation
- Next.js guardian web dashboard (alert history, settings)
- React Native (Expo) mobile app: home screen, result screen, emergency screen
- 5-step setup wizard với voice accent selection

**Phase 4 — Self-Learning & Production**
- 8-source knowledge crawler: Bộ Công an, CATP, banks, cybersecurity
- RSS + HTML scraping với Vietnamese keyword extraction
- User report system: submission → moderation → KB entry
- Community intelligence: 3+ independent reports = auto-add to DB
- Pattern auto-update pipeline (không cần redeploy)
- Rate limiting: 30 req/60s per IP
- Input sanitization: XSS, prototype pollution protection
- Security headers: HSTS, X-Frame-Options, X-Content-Type-Options
- System monitoring + cron job setup
