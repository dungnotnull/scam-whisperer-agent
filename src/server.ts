import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { AnalyzeRequestSchema, type AnalyzeRequest, type AnalyzeResponse } from './types';
import { runAnalysisPipeline } from './agents/orchestrator';
import { getCostTracker } from './tools/llm-client';
import { rateLimiter, validateContentType, validateImageSize, sanitizeMiddleware, setupSecurityHeaders } from './tools/middleware';
import { addUserReportRoute } from './agents/knowledge-updater/user-reports';
import { submitReport, getPendingReports, getReportsByUser, getCommunityIntelligence } from './agents/knowledge-updater/user-reports';
import { createUserProfile, createGuardian, setupGuardianLink, completePairing } from './notifications/setup-pairing';
import { guardianRegistry, generateWeeklyDigest } from './notifications/guardian-manager';
import { collectMetrics } from './tools/monitoring';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(cors());
  app.use(express.json({ limit: '20mb' }));
  app.use(setupSecurityHeaders());
  app.use(validateContentType);
  app.use(sanitizeMiddleware);

  const analysisLimiter = rateLimiter(30, 60_000);
  const reportLimiter = rateLimiter(10, 60_000);

  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      version: '0.0.1',
      timestamp: new Date().toISOString(),
      api_configured: !!process.env.ANTHROPIC_API_KEY,
      metrics: collectMetrics(),
    });
  });

  app.get('/metrics', (_req: Request, res: Response) => {
    res.json({
      cost: getCostTracker(),
      system: collectMetrics(),
    });
  });

  app.post('/analyze', analysisLimiter, validateImageSize(15 * 1024 * 1024), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = AnalyzeRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'INVALID_REQUEST', message: 'Request body does not match expected schema', details: parseResult.error.flatten() });
        return;
      }
      const request: AnalyzeRequest = parseResult.data;
      const startTime = Date.now();
      const result: AnalyzeResponse = await runAnalysisPipeline(request, startTime);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.post('/analyze/voice', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { text, user_id, follow_up_context } = req.body;
      if (!text || !user_id) {
        res.status(400).json({ error: 'text and user_id are required' });
        return;
      }
      const { detectEmergencyFromVoice, detectVoiceCommand } = await import('./voice/stt-adapter');
      const isEmergency = detectEmergencyFromVoice(text);
      const command = detectVoiceCommand(text);
      const context = isEmergency ? text : (follow_up_context || '');
      const request: AnalyzeRequest = { image_base64: '', user_id, media_type: 'audio/wav', follow_up_context: context };
      const result = await runAnalysisPipeline(request, Date.now());
      res.json({ ...result, voice_command: command });
    } catch (error) {
      next(error);
    }
  });

  app.get('/voice/presets', (_req: Request, res: Response) => {
    const { VOICE_PRESETS } = require('./voice/tts-profiles');
    res.json({ presets: Object.keys(VOICE_PRESETS) });
  });

  app.post('/voice/synthesize', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { text, voice_preset, threat_level } = req.body;
      const { synthesizeVoiceResponse } = await import('./voice/tts-adapter');
      const result = await synthesizeVoiceResponse(text || '', voice_preset || 'north_female', threat_level || 'GREEN');
      if (!result) { res.status(500).json({ error: 'TTS_FAILED', message: 'All TTS providers failed' }); return; }
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.post('/setup/user', (req: Request, res: Response) => {
    const { name, form_of_address, region, voice_preference, guardian_phone, guardian_name } = req.body;
    if (!name || !guardian_phone) {
      res.status(400).json({ error: 'name and guardian_phone are required' });
      return;
    }
    const guardian = createGuardian(guardian_name || 'Người thân', guardian_phone, 'PRIMARY');
    const user = createUserProfile(name, form_of_address || 'ông/bà', region || 'south', voice_preference || 'south_female', guardian.id);
    const { pairingCode, qrData } = setupGuardianLink(user.id, guardian);
    res.json({ user_id: user.id, guardian_id: guardian.id, pairing_code: pairingCode, qr_data: qrData });
  });

  app.get('/setup/pairing/:code', (req: Request, res: Response) => {
    const result = completePairing(req.params.code);
    if (!result) { res.status(404).json({ error: 'Invalid or expired pairing code' }); return; }
    res.json({ status: 'paired', ...result });
  });

  app.get('/guardian/alerts', (_req: Request, res: Response) => {
    const allUsers = guardianRegistry.getAllUsers();
    if (allUsers.length === 0) {
      res.json({ alerts: [] });
      return;
    }
    const firstUser = allUsers[0];
    const digest = generateWeeklyDigest(firstUser.id);
    res.json({ alerts: digest ? [{
      id: 'weekly-' + Date.now(),
      timestamp: digest.timestamp.toISOString(),
      user_name: digest.elderly_user_name,
      threat_level: digest.threat_level,
      summary: digest.summary_vi,
      category: 'weekly_digest',
      action_taken: digest.action_taken,
    }] : [] });
  });

  app.get('/guardian/users', (_req: Request, res: Response) => {
    res.json({ users: guardianRegistry.getAllUsers().map(u => ({ id: u.id, name: u.name, form_of_address: u.formOfAddress, region: u.region })) });
  });

  app.post('/guardian/digest/:userId', (req: Request, res: Response) => {
    const digest = generateWeeklyDigest(req.params.userId);
    if (!digest) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(digest);
  });

  addUserReportRoute(app);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[server] Unhandled error:', err.message);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  });

  return app;
}
