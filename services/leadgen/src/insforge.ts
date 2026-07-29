import { createClient } from "@insforge/sdk";

const baseUrl = process.env.INSFORGE_URL || process.env.NEXT_PUBLIC_INSFORGE_URL || "";
const apiKey = process.env.INSFORGE_API_KEY || process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || "";

if (!baseUrl || !apiKey) {
  console.warn("InsForge configuration missing INSFORGE_URL or INSFORGE_API_KEY");
}

export const insforge = createClient({
  baseUrl,
  anonKey: apiKey,
});

export default insforge;
