import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface CrawlSchedule {
  job: string;
  cron: string;
  enabled: boolean;
}

export function getSchedules(): CrawlSchedule[] {
  return [
    { job: 'daily_crawl', cron: '0 6 * * *', enabled: true },
    { job: 'weekly_kb_cleanup', cron: '0 8 * * 0', enabled: true },
    { job: 'community_intelligence', cron: '0 */6 * * *', enabled: true },
  ];
}

export function setupCronJobs(): void {
  const schedules = getSchedules().filter((s) => s.enabled);

  for (const schedule of schedules) {
    const intervalMs = parseCronToMs(schedule.cron);
    if (intervalMs > 0) {
      setInterval(() => {
        runJob(schedule.job);
      }, intervalMs);
    }
  }
}

function parseCronToMs(cron: string): number {
  if (cron === '0 6 * * *') return 24 * 60 * 60 * 1000;
  if (cron === '0 8 * * 0') return 7 * 24 * 60 * 60 * 1000;
  if (cron === '0 */6 * * *') return 6 * 60 * 60 * 1000;
  return 0;
}

async function runJob(jobName: string): Promise<void> {
  switch (jobName) {
    case 'daily_crawl': {
      const { runDailyCrawl } = await import('../agents/knowledge-updater/crawler');
      const result = await runDailyCrawl();
      console.log(`[cron] daily_crawl: ${result.sourcesChecked} sources, ${result.reportsFound} reports, ${result.newPhrasesAdded} new phrases`);
      break;
    }
    case 'community_intelligence': {
      const ci = await import('../agents/knowledge-updater/user-reports');
      const intel = ci.getCommunityIntelligence();
      console.log(`[cron] community_intel: ${intel.phones.length} scam phones, ${intel.accounts.length} scam accounts with 3+ reports`);
      break;
    }
    case 'weekly_kb_cleanup':
      console.log('[cron] weekly_kb_cleanup: Knowledge base maintenance');
      break;
  }
}

export function collectMetrics(): {
  uptime: number;
  memoryMB: number;
  analysisCount: number;
  errorCount: number;
} {
  return {
    uptime: process.uptime(),
    memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    analysisCount: 0,
    errorCount: 0,
  };
}

export function getDeploymentGuide(): string {
  const candidates = [
    join(process.cwd(), 'docs', 'deployment.md'),
    join(process.cwd(), 'README.md'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return readFileSync(p, 'utf-8');
  }
  return 'See README.md for deployment instructions.';
}
