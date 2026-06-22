Trigger.dev Example Flow - schedule evaluation of triggers

This file shows a minimal example of how to schedule the evaluation endpoint using Trigger.dev or any scheduler.

1) HTTP job (Trigger.dev) — call our evaluation endpoint periodically

Example (pseudo-code / illustrative):

```js
// This is an illustrative example — adapt to Trigger.dev's SDK shape
import fetch from 'node-fetch';

export default async function handler() {
  // call the app's evaluation endpoint
  await fetch(process.env.NEXT_PUBLIC_SITE_URL + '/api/jobs/evaluate-triggers', { method: 'POST' });
}

// Configure Trigger.dev to run this handler on a schedule, e.g. every 30s / 1m / 5m
```

2) Alternative: Let Trigger.dev call the worker URL directly

If you run `scripts/trigger-worker.js` on a machine reachable by Trigger.dev, you can expose a tiny HTTP handler that triggers the worker loop or hit the Next.js route above.

Notes:
- Ensure `NEXT_PUBLIC_SITE_URL` points to your running app (publicly reachable if Trigger.dev needs to call it).
- Ensure the Insforge admin API key (`INSFORGE_API_KEY`) is present in the app environment so the evaluation endpoint can read/write the DB.
- The evaluation route is `POST /api/jobs/evaluate-triggers` and will scan active triggers, evaluate simple conditions, and insert `alerts` rows when matches occur.
