import { createClient } from '@insforge/sdk';

export function createInsforgeClient(url: string, apiKey: string) {
  if (!url || !apiKey) {
    throw new Error('InsForge URL and API key are required');
  }
  return createClient({
    baseUrl: url,
    anonKey: apiKey,
  });
}

export type InsforgeClient = ReturnType<typeof createInsforgeClient>;
