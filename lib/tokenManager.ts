import { createAdminClient } from "@insforge/sdk";
import { refreshToken } from "./authHelpers";

export async function refreshAndSaveIntegration(userId: string, platform: string) {
  try {
    const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });

    const { data: existing, error } = await admin.database.from("integrations").select("id, state").eq("user_id", userId).eq("platform", platform).maybeSingle();
    if (error) {
      console.error("tokenManager: failed to fetch integration", error);
      return null;
    }

    if (!existing) return null;

    const oldState = existing.state || {};
    const newState = await refreshToken(platform, oldState);

    // If state changed, persist
    if (JSON.stringify(newState) !== JSON.stringify(oldState)) {
      await admin.database.from("integrations").update({ state: newState, updated_at: new Date().toISOString() }).eq("id", existing.id);
    }

    return newState;
  } catch (err) {
    console.error("refreshAndSaveIntegration error", err);
    return null;
  }
}

export default { refreshAndSaveIntegration };
