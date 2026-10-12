// GET /api/admin?days=30: leady + funnel pro admin stránku. DELETE /api/admin?id=…: výmaz leadu (GDPR).
// Přístup: hlavička Authorization: Bearer <ADMIN_PASSWORD>.
const crypto = require('crypto');
const { enabled, pipeline, day } = require('./_redis');

function authorized(req) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const got = String(req.headers.authorization || '').replace(/^Bearer /, '');
  const a = crypto.createHash('sha256').update(got).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!authorized(req)) return res.status(401).json({ ok: false, error: 'unauthorized' });
  if (!enabled) return res.status(503).json({ ok: false, error: 'redis_not_configured' });

  const url = new URL(req.url, 'http://x');

  if (req.method === 'DELETE') {
    const id = url.searchParams.get('id');
    const [raw] = await pipeline([['HGET', 'lead_by_id', id]]);
    if (!raw) return res.status(404).json({ ok: false });
    await pipeline([['LREM', 'leads', 1, raw], ['HDEL', 'lead_by_id', id]]);
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'GET') return res.status(405).end();
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days'), 10) || 30, 1), 365);
  const dates = [];
  for (let i = 0; i < days; i++) dates.push(day(new Date(Date.now() - i * 864e5)));

  const results = await pipeline([['LRANGE', 'leads', 0, 999], ...dates.map((d) => ['HGETALL', 'ev:' + d])]);
  const leads = results[0].map((s) => JSON.parse(s));
  const daily = dates.map((d, i) => {
    const flat = results[i + 1] || [];
    const counts = {};
    for (let j = 0; j < flat.length; j += 2) counts[flat[j]] = Number(flat[j + 1]);
    return { date: d, counts };
  });
  return res.status(200).json({ ok: true, leads, daily });
};
