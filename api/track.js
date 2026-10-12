// POST /api/track: anonymní počítadla kroků funnelu (bez cookies, bez osobních údajů).
// Klient posílá každou událost max. jednou za návštěvu, takže počty ≈ počet návštěv, které krok udělaly.
const { enabled, pipeline, day } = require('./_redis');

const ALLOWED = new Set([
  'lp_view', 'hero_cta', 'section_view:table', 'section_view:calc', 'section_view:form',
  'calc_interact', 'unlock_click', 'calc_cta', 'sticky_cta',
  'form_focus', 'form_submit', 'form_error', 'lead_success', 'lead_fail'
]);
const TTL = 60 * 60 * 24 * 400; // ~13 měsíců

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  let body = req.body;
  try { if (typeof body === 'string') body = JSON.parse(body || '{}'); } catch (e) { body = {}; }
  const event = String((body && body.event) || '');
  const variant = body && (body.variant === 'b' ? 'b' : 'a');
  if (!ALLOWED.has(event)) return res.status(204).end();
  if (!enabled) return res.status(204).end();
  const key = 'ev:' + day();
  try {
    await pipeline([['HINCRBY', key, variant + '|' + event, 1], ['EXPIRE', key, TTL]]);
  } catch (e) {
    console.error('track', String(e));
  }
  return res.status(204).end();
};
