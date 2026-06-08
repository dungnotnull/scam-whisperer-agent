import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './server';
import { loadConfig } from './tools/config';
import { setupCronJobs } from './tools/monitoring';

async function main() {
  const config = loadConfig();
  const app = createApp();

  app.listen(config.server.port, () => {
    console.log('');
    console.log('🛡️  scam-whisperer-agent');
    console.log(`   Server running on http://localhost:${config.server.port}`);
    console.log(`   Environment: ${config.server.nodeEnv}`);

    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('   ⚠️  ANTHROPIC_API_KEY not set — API calls will return stub data');
      console.warn('   Copy .env.example to .env and fill in your keys');
    }

    console.log('');
    console.log('   POST /analyze          — Analyze screenshot/image');
    console.log('   POST /analyze/voice    — Analyze from voice input');
    console.log('   POST /voice/synthesize — Text-to-speech');
    console.log('   POST /setup/user       — Create user + guardian');
    console.log('   POST /report           — Submit scam report');
    console.log('   GET  /guardian/alerts  — Guardian dashboard data');
    console.log('   GET  /health           — Health check');
    console.log('   GET  /metrics          — Cost & system metrics');
    console.log('');
  });

  setupCronJobs();
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
