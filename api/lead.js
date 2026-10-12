// POST /api/lead: uloží kontakt a pošle srovnání e-mailem.
// Env proměnné (viz README):
//   KV_REST_API_URL + KV_REST_API_TOKEN: Upstash Redis, hlavní úložiště leadů (zobrazuje /admin.html)
//   LEAD_WEBHOOK_URL: volitelně kopie leadu jako JSON jinam (CRM, Google Sheet…)
//   RESEND_API_KEY + MAIL_FROM: odeslání e-mailu se srovnáním přes resend.com
const fs = require('fs');
const crypto = require('crypto');
const redis = require('./_redis');
const path = require('path');
const vm = require('vm');

function loadData() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(process.cwd(), 'public', 'data.js'), 'utf8'), ctx);
  return ctx.window;
}

const czk = (n) => new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(Math.round(n / 1000) * 1000) + ' Kč';
const pct = (n) => n.toLocaleString('cs-CZ', { minimumFractionDigits: 2 }) + ' %';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function fv(monthly, years, feePct, ret) {
  const i = (ret - feePct) / 100 / 12;
  return monthly * (Math.pow(1 + i, years * 12) - 1) / i;
}

function emailHtml(data, calc) {
  const rows = data.ETF_PAIRS.map((p) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee"><s>${p.us.ticker}</s><br><small>${pct(p.us.ter)}</small></td>
      <td style="padding:8px;border-bottom:1px solid #eee"><b>${p.eu.ticker}</b><br><small>${p.eu.name}</small><br><code>${p.eu.isin}</code></td>
      <td style="padding:8px;border-bottom:1px solid #eee">${pct(p.eu.ter)}<br><small>${p.eu.policy}</small></td>
    </tr>`).join('');
  let calcBlock = '';
  if (calc && calc.monthly && calc.years && calc.fee) {
    const diff = fv(calc.monthly, calc.years, data.ETF_TER, data.ASSUMED_RETURN) - fv(calc.monthly, calc.years, calc.fee, data.ASSUMED_RETURN);
    calcBlock = `<p style="background:#e3f4ec;padding:12px;border-radius:8px">Váš výpočet: <b>${czk(calc.monthly)} měsíčně, ${calc.years} let</b>.
      Proti fondu s poplatkem ${calc.fee} % ušetříte s ETF přibližně <b>${czk(diff)}</b> (předpoklad 7 % ročně před poplatky).</p>`;
  }
  return `<div style="font-family:Arial,sans-serif;max-width:560px;color:#12233d">
    <h2>Vaše srovnání ETF z NYSE a jejich evropských dvojčat</h2>
    ${calcBlock}
    <table style="border-collapse:collapse;width:100%;font-size:14px">
      <tr style="text-align:left"><th style="padding:8px">USA (nekoupíte)</th><th style="padding:8px">Koupíte v ČR</th><th style="padding:8px">Poplatek</th></tr>
      ${rows}
    </table>
    <h3>Jak koupit první ETF v 5 krocích</h3>
    <ol>
      <li>Vyberte brokera s přístupem na evropské burzy (např. XTB, Trading 212, Interactive Brokers, Fio e-Broker) a porovnejte jeho poplatky.</li>
      <li>Hledejte fond podle ISIN, ne podle názvu.</li>
      <li>Zvolte akumulační verzi (Acc), pokud nechcete danit dividendy.</li>
      <li>Nastavte pravidelnou měsíční investici.</li>
      <li>Držte alespoň 3 roky (časový test). Detaily ověřte u daňového poradce.</li>
    </ol>
    <p style="font-size:12px;color:#6b778c">Data k ${data.DATA_DATE}, zdroje: stockanalysis.com, justETF.com. Nejde o investiční doporučení.
      Pokud už nechcete dostávat e-maily, odpovězte „odhlásit“.</p>
  </div>`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const email = String(body.email || '').trim().toLowerCase();

  // Honeypot: boti vyplní skryté pole. Vracíme OK, aby nepoznali, že byli odhaleni.
  if (body.company) return res.status(200).json({ ok: true });
  if (!/^[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}$/.test(email) || email.length > 200) {
    return res.status(400).json({ ok: false, error: 'invalid_email' });
  }

  const lead = {
    id: crypto.randomUUID(),
    email,
    variant: String(body.variant || '').slice(0, 4),
    utm: body.utm || {},
    calc: body.calc || null,
    time_to_lead_ms: Number(body.time_to_lead_ms) || null,
    page: String(body.page || '').slice(0, 300),
    ua: String(req.headers['user-agent'] || '').slice(0, 300),
    created_at: new Date().toISOString()
  };

  // Uložení leadu je kritické: když selže, vrátíme chybu a uživatel zkusí znovu.
  if (redis.enabled) {
    const raw = JSON.stringify(lead);
    try {
      await redis.pipeline([['LPUSH', 'leads', raw], ['HSET', 'lead_by_id', lead.id, raw]]);
    } catch (e) {
      console.error('lead store failed', String(e));
      return res.status(502).json({ ok: false, error: 'store_failed' });
    }
  }

  const tasks = [];
  if (process.env.LEAD_WEBHOOK_URL) {
    tasks.push(fetch(process.env.LEAD_WEBHOOK_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead)
    }).then((r) => { if (!r.ok) throw new Error('webhook ' + r.status); }));
  }
  if (process.env.RESEND_API_KEY && process.env.MAIL_FROM) {
    const data = loadData();
    tasks.push(fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.MAIL_FROM, to: email,
        subject: 'Vaše srovnání ETF: co koupit místo VOO a SPY',
        html: emailHtml(data, lead.calc)
      })
    }).then((r) => { if (!r.ok) throw new Error('resend ' + r.status); }));
  }
  if (!redis.enabled) console.warn('lead: Redis není nastaven, lead je jen v logu');

  const results = await Promise.allSettled(tasks);
  const failed = results.filter((r) => r.status === 'rejected').map((r) => String(r.reason));
  console.log(JSON.stringify({ type: 'lead', variant: lead.variant, utm: lead.utm, time_to_lead_ms: lead.time_to_lead_ms, failed }));

  return res.status(200).json({ ok: true });
};

module.exports.emailHtml = emailHtml;
module.exports.loadData = loadData;
