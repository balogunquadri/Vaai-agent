// Simple local worker that calls the server evaluation endpoint on an interval.
// Run with: `node scripts/trigger-worker.js` (ensure NEXT_PUBLIC_SITE_URL is set or default localhost:3000)

const fetch = global.fetch || require('node-fetch');
const INTERVAL_MS = process.env.TRIGGER_WORKER_INTERVAL_MS ? parseInt(process.env.TRIGGER_WORKER_INTERVAL_MS,10) : 30_000;
const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function runOnce() {
  try {
    const res = await fetch(`${BASE}/api/jobs/evaluate-triggers`, { method: 'POST' });
    const data = await res.json();
    console.log(new Date().toISOString(), 'evaluate-triggers ->', data.success ? 'ok' : 'failed', data.results ? `(${data.results.length} triggers)` : '');
  } catch (err) {
    console.error('Worker error', err);
  }
}

console.log('Trigger worker starting; calling', `${BASE}/api/jobs/evaluate-triggers`, 'every', INTERVAL_MS, 'ms');
runOnce();
setInterval(runOnce, INTERVAL_MS);
