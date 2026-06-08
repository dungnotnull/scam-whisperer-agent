const SAFE_BROWSING_API = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

interface SafeBrowsingMatch {
  threatType: string;
  platformType: string;
  threat: { url: string };
}

let _apiKey: string | null = null;

function getApiKey(): string | null {
  if (_apiKey) return _apiKey;
  _apiKey = process.env.GOOGLE_SAFE_BROWSING_KEY || null;
  return _apiKey;
}

async function checkSafeBrowsing(urls: string[]): Promise<string[]> {
  const apiKey = getApiKey();
  if (!apiKey || urls.length === 0) return [];

  try {
    const response = await fetch(`${SAFE_BROWSING_API}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: { clientId: 'scam-whisperer-agent', clientVersion: '0.0.1' },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: urls.map((url) => ({ url })),
        },
      }),
    });

    if (!response.ok) return [];
    const data = (await response.json()) as { matches?: SafeBrowsingMatch[] };
    return (data.matches || []).map((m) => m.threat.url);
  } catch {
    return [];
  }
}

function detectSuspiciousDomains(urls: string[]): string[] {
  const malicious: string[] = [];
  const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.club', '.work', '.click'];
  const knownFakePrefixes = ['vcb-', 'bidv-', 'techcombank-', 'vietcombank-', 'vneid-', 'cccd-', 'canh-sat-'];

  for (const url of urls) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      if (suspiciousTlds.some((tld) => hostname.endsWith(tld))) {
        malicious.push(url);
        continue;
      }
      if (knownFakePrefixes.some((pfx) => hostname.includes(pfx)) && !hostname.includes('.com.vn')) {
        malicious.push(url);
        continue;
      }
    } catch {
      malicious.push(url);
    }
  }
  return malicious;
}

export async function checkUrls(urls: string[]): Promise<{ maliciousUrls: string[]; checkMethod: string }> {
  if (urls.length === 0) return { maliciousUrls: [], checkMethod: 'none' };

  const suspiciousFromPattern = detectSuspiciousDomains(urls);
  const safeBrowsingResults = await checkSafeBrowsing(urls);

  const allMalicious = [...new Set([...suspiciousFromPattern, ...safeBrowsingResults])];
  const checkMethod = safeBrowsingResults.length > 0 ? 'safe-browsing+pattern' : 'pattern-only';

  return { maliciousUrls: allMalicious, checkMethod };
}
