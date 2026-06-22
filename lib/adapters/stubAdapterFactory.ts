import { getSimulatedFeed } from "../simulatedFeeds";
import tokenManager from "../tokenManager";

export function createStubAdapter(platformId: string, extraTools: string[] = []) {
  return {
    platform: platformId,
    async getRecentItems({ userId, limit = 20 }: { userId?: string; limit?: number }) {
      // Attempt to refresh tokens for this user/platform before returning items
      try {
        if (userId) await tokenManager.refreshAndSaveIntegration(userId, platformId);
      } catch (err) {
        // non-fatal
        console.error("stubAdapterFactory: refresh failed", platformId, err);
      }
      const all = getSimulatedFeed(platformId);
      return all.slice(0, limit);
    },
    async executeTool({ tool, params, userId }: { tool: string; params?: any; userId?: string }) {
      // Attempt token refresh for authenticated calls
      try {
        if (userId) await tokenManager.refreshAndSaveIntegration(userId, platformId);
      } catch (err) {
        console.error("stubAdapterFactory: refresh failed before execute", platformId, err);
      }

      // Basic simulated responses per common action names
      if (tool === "list" || tool.endsWith("_list") || tool.includes("channels") || tool.includes("repos")) {
        return { ok: true, items: getSimulatedFeed(platformId).slice(0, 10) };
      }
      if (tool === "post" || tool.includes("message") || tool.includes("create") || tool.includes("comment")) {
        return { ok: true, id: `${platformId}_sim_${Date.now()}`, status: "posted", params };
      }
      if (tool === "get" || tool.includes("get_page") || tool.includes("fetch")) {
        const items = getSimulatedFeed(platformId);
        return { ok: true, item: items[0] || null };
      }
      // Default stub
      return { ok: true, tool, params, note: "simulated" };
    }
  };
}

export default createStubAdapter;
