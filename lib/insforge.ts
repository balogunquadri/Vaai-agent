import { createClient } from '@insforge/sdk';

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || '';

if (!baseUrl || !anonKey) {
  console.warn('InsForge configuration is missing baseUrl or anonKey.');
}

export const insforge = createClient({
  baseUrl,
  anonKey,
});
