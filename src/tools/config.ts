import { AppConfig } from '../types';

export function loadConfig(): AppConfig {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  ANTHROPIC_API_KEY not set — LLM calls will fail. Set it in .env');
  }

  return {
    anthropic: {
      apiKey: apiKey || 'MISSING_API_KEY',
      visionModel: process.env.ANTHROPIC_VISION_MODEL || 'claude-sonnet-4-20250514',
      textModel: process.env.ANTHROPIC_TEXT_MODEL || 'claude-sonnet-4-20250514',
    },
    server: {
      port: parseInt(process.env.PORT || '3000', 10),
      nodeEnv: process.env.NODE_ENV || 'development',
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
  };
}
