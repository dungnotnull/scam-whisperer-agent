#!/usr/bin/env node

const { existsSync, readFileSync } = require('fs');
const { join } = require('path');

const REQUIRED_VARS = ['ANTHROPIC_API_KEY'];
const RECOMMENDED_VARS = ['GOOGLE_TTS_KEY', 'GOOGLE_SAFE_BROWSING_KEY'];
const OPTIONAL_VARS = ['FPT_AI_TTS_KEY', 'VIRUSTOTAL_API_KEY', 'ZALO_APP_ID', 'TWILIO_ACCOUNT_SID'];

function checkEnv() {
  const envPath = join(process.cwd(), '.env');
  const examplePath = join(process.cwd(), '.env.example');
  const hasEnv = existsSync(envPath);

  if (!hasEnv) {
    console.log('⚠️  No .env file found. Creating from .env.example...');
    if (existsSync(examplePath)) {
      const example = readFileSync(examplePath, 'utf-8');
      require('fs').writeFileSync(envPath, example);
      console.log('✅ Created .env — edit it with your API keys');
      console.log('   Required: ANTHROPIC_API_KEY');
      console.log('   Recommended: GOOGLE_TTS_KEY, GOOGLE_SAFE_BROWSING_KEY');
      return false;
    }
    console.log('❌ No .env.example found. Cannot create .env');
    return false;
  }

  return true;
}

function validateConfig() {
  const results = { pass: true, missing: [], recommended: [], optional: [] };

  for (const key of REQUIRED_VARS) {
    if (!process.env[key] || process.env[key].includes('xxxx')) {
      results.missing.push(key);
      results.pass = false;
    }
  }

  for (const key of RECOMMENDED_VARS) {
    if (!process.env[key] || process.env[key].includes('xxxx')) {
      results.recommended.push(key);
    }
  }

  for (const key of OPTIONAL_VARS) {
    if (!process.env[key] || process.env[key].includes('xxxx')) {
      results.optional.push(key);
    }
  }

  return results;
}

function printReport(results) {
  console.log('');
  console.log('══════════════════════════════════════════════');
  console.log('  scam-whisperer-agent — Setup Check');
  console.log('══════════════════════════════════════════════');
  console.log('');

  if (results.missing.length === 0) {
    console.log('✅ All required API keys configured');
  } else {
    console.log(`❌ Missing required keys: ${results.missing.join(', ')}`);
    console.log('   These are needed for core functionality.');
  }

  if (results.recommended.length > 0) {
    console.log(`⚠️  Recommended keys not set: ${results.recommended.join(', ')}`);
    console.log('   Without them: TTS, URL checking, and family alerts are degraded.');
  }

  if (results.optional.length > 0) {
    console.log(`ℹ️  Optional keys not set: ${results.optional.join(', ')}`);
  }

  console.log('');
  console.log('Current capabilities:');
  console.log(`  Vision Analysis:     ${process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('xxxx') ? '✅' : '❌ (stub)'}`);
  console.log(`  Text-to-Speech:      ${process.env.GOOGLE_TTS_KEY && !process.env.GOOGLE_TTS_KEY.includes('xxxx') ? '✅ Google' : process.env.FPT_AI_TTS_KEY && !process.env.FPT_AI_TTS_KEY.includes('xxxx') ? '✅ FPT.AI' : '⚠️  offline only'}`);
  console.log(`  URL Safety Check:    ${process.env.GOOGLE_SAFE_BROWSING_KEY && !process.env.GOOGLE_SAFE_BROWSING_KEY.includes('xxxx') ? '✅ Safe Browsing' : '⚠️  pattern-only'}`);
  console.log(`  Family Alerts:       ${process.env.ZALO_APP_ID && !process.env.ZALO_APP_ID.includes('xxxx') ? '✅ Zalo' : process.env.TWILIO_ACCOUNT_SID && !process.env.TWILIO_ACCOUNT_SID.includes('xxxx') ? '⚠️  SMS only' : '❌ disabled'}`);
  console.log(`  Pattern Detection:   ✅ (offline, always available)`);
  console.log('');

  if (results.pass) {
    console.log('✅ Ready to start: npm run dev');
  } else {
    console.log('❌ Configure ANTHROPIC_API_KEY in .env, then: npm run dev');
  }

  console.log('');
}

require('dotenv').config();
checkEnv();
const results = validateConfig();
printReport(results);

module.exports = { checkEnv, validateConfig, printReport };
