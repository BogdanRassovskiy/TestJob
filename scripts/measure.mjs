// Měření celé cesty uživatele na mobilu: vstup z reklamy → odeslání formuláře.
// Emulace iPhone 13 + síť „rychlé 4G“ (CDP throttling). Pro obě varianty reklamy.
// Použití: node scripts/measure.mjs [baseUrl]   (výchozí http://localhost:3000)
import { chromium, devices } from 'playwright';
import fs from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:3000';
const OUT = 'measure-output';
fs.mkdirSync(OUT, { recursive: true });

// Rychlé 4G dle Lighthouse: RTT 150 ms, ~1,6 Mbit/s down. Pesimistický mobil.
const NET = { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 };

async function run(variant) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', NET);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  // Nepovolíme skutečné odeslání do produkčního úložiště, pokud měříme cizí URL.
  if (!BASE.includes('localhost')) {
    await page.route('**/api/lead', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
    await page.route('**/api/track', (r) => r.fulfill({ status: 204 })); // nezkreslovat produkční funnel
  }

  const steps = [];
  const t0 = Date.now();
  const mark = async (name, taps) => {
    steps.push({ step: name, ms: Date.now() - t0, taps });
    await page.screenshot({ path: `${OUT}/${variant}-${String(steps.length).padStart(2, '0')}-${name}.png` });
  };

  await page.goto(`${BASE}/?v=${variant}&utm_source=measure&utm_content=${variant}`, { waitUntil: 'load' });
  const vitals = await page.evaluate(() => new Promise((res) => {
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    let lcp = 0;
    new PerformanceObserver((l) => { const e = l.getEntries(); lcp = e[e.length - 1].startTime; })
      .observe({ type: 'largest-contentful-paint', buffered: true });
    setTimeout(() => res({ fcp_ms: Math.round(fcp ? fcp.startTime : 0), lcp_ms: Math.round(lcp),
      transfer_kb: Math.round(performance.getEntriesByType('resource').reduce((s, r) => s + r.transferSize, 0) / 1024
        + performance.getEntriesByType('navigation')[0].transferSize / 1024) }), 300);
  }));
  await mark('landing', 0);

  // Co je vidět bez scrollování: CTA a slib z reklamy.
  const fold = await page.evaluate(() => {
    const vis = (s) => { const r = document.querySelector(s).getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; };
    return { h1_above_fold: vis('h1'), cta_above_fold: vis('[data-variant-cta]'), viewport_h: innerHeight };
  });

  let taps = 0;
  await page.click('[data-variant-cta]'); taps++;
  await page.waitForTimeout(600);
  await mark('after-hero-cta', taps);

  await page.locator('#kalkulacka').scrollIntoViewIfNeeded();
  await page.click('[data-calc="monthly"] button[data-val="5000"]'); taps++;
  await page.click('[data-calc="years"] button[data-val="30"]'); taps++;
  await mark('calc-result', taps);

  await page.click('a[data-track="calc_cta"]'); taps++;
  await page.waitForTimeout(700);
  await mark('form', taps);

  await page.fill('#email', 'mereni@seznam.cz'); taps++; // tap do pole + psaní
  await page.click('[data-lead-form] button[type=submit]'); taps++;
  await page.waitForSelector('[data-thanks]:not([hidden])', { timeout: 10000 });
  await page.waitForTimeout(700);
  await mark('thanks', taps);

  const events = await page.evaluate(() => window.__events.map((e) => `${e.props.t_ms}ms ${e.event}${e.props.section ? ':' + e.props.section : ''}${e.props.depth ? ':' + e.props.depth : ''}`));
  const unlockedPairs = await page.locator('.pair').count();
  await browser.close();
  return { variant, vitals, fold, steps, unlockedPairs, events };
}

const results = [];
for (const v of ['a', 'b']) results.push(await run(v));
fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
for (const r of results) {
  console.log(`\n=== Varianta ${r.variant.toUpperCase()} ===`);
  console.log('Vitals:', r.vitals, 'Fold:', r.fold);
  console.table(r.steps);
  console.log('Odemčeno dvojic:', r.unlockedPairs);
  console.log('Události:', r.events.join(' | '));
}
