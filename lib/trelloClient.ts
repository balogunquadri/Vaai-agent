const tokenState: Map<string, { lastTs: number; queue: (() => void)[] }> = new Map();

// Minimum interval per user token (100ms -> 10 req/sec) to respect Trello per-token limits.
const PER_TOKEN_INTERVAL_MS = 100;

function enqueueForToken(token: string, fn: () => Promise<Response>): Promise<Response> {
  if (!token) return fn();
  if (!tokenState.has(token)) tokenState.set(token, { lastTs: 0, queue: [] });

  const state = tokenState.get(token)!;

  return new Promise((resolve, reject) => {
    const run = async () => {
      try {
        const now = Date.now();
        const wait = Math.max(0, PER_TOKEN_INTERVAL_MS - (now - state.lastTs));
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));
        const res = await fn();
        state.lastTs = Date.now();
        resolve(res);
      } catch (err) {
        reject(err);
      } finally {
        // schedule next queued
        const next = state.queue.shift();
        if (next) next();
      }
    };

    state.queue.push(() => run());
    // If queue length is 1, start immediately
    if (state.queue.length === 1) {
      const starter = state.queue[0];
      starter();
    }
  });
}

export async function trelloFetch(input: RequestInfo, init: RequestInit = {}, key?: string, token?: string): Promise<Response> {
  // prefer token-rate limiting (stricter). If token is missing, fall back to key spacing by using key as token key
  const limiterKey = token || key || "global";

  return enqueueForToken(limiterKey, () => fetch(input, init));
}

export default trelloFetch;
