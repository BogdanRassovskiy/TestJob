// Minimální klient pro Upstash Redis REST API, bez závislostí.
// Soubor začíná podtržítkem, takže z něj Vercel nedělá samostatný endpoint.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const enabled = Boolean(URL_ && TOKEN);

async function pipeline(commands) {
  if (!enabled) throw new Error('redis_not_configured');
  const r = await fetch(URL_ + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands)
  });
  if (!r.ok) throw new Error('redis ' + r.status);
  const out = await r.json();
  const err = out.find((x) => x.error);
  if (err) throw new Error('redis ' + err.error);
  return out.map((x) => x.result);
}

const day = (d = new Date()) => d.toISOString().slice(0, 10);

module.exports = { enabled, pipeline, day };
