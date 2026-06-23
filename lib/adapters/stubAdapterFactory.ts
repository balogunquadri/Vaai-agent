import { getSimulatedFeed } from "../simulatedFeeds";
import tokenManager from "../tokenManager";

export function createStubAdapter(platformId: string, extraTools: string[] = []) {
  return {
    platform: platformId,
    // Support both positional signature (userId, limit, userState) and object signature ({ userId, limit })
    async getRecentItems(userIdOrOpts: any, limitParam?: number, _userState?: any) {
      let userId: string | undefined;
      let limit = limitParam ?? 20;
      if (userIdOrOpts && typeof userIdOrOpts === 'object' && (userIdOrOpts.userId || userIdOrOpts.limit !== undefined)) {
        userId = userIdOrOpts.userId;
        limit = userIdOrOpts.limit ?? limit;
      } else {
        userId = userIdOrOpts;
      }

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
    // Execute tool supports either object-style `({ tool, params, userId })`
    // or positional `(userId, toolName, args, userState)` signatures.
    async executeTool(userIdOrOpts: any, toolName?: string, args?: any, _userState?: any) {
      let userId: string | undefined;
      let tool: string;
      let params: any;

      if (userIdOrOpts && typeof userIdOrOpts === 'object' && (userIdOrOpts.tool || userIdOrOpts.params || userIdOrOpts.userId)) {
        tool = userIdOrOpts.tool;
        params = userIdOrOpts.params;
        userId = userIdOrOpts.userId;
      } else {
        userId = userIdOrOpts;
        tool = toolName as string;
        params = args;
      }

      // Attempt token refresh for authenticated calls
      try {
        if (userId) await tokenManager.refreshAndSaveIntegration(userId, platformId);
      } catch (err) {
        console.error("stubAdapterFactory: refresh failed before execute", platformId, err);
      }

      // Basic simulated responses per common action names
      if (tool === "list" || (tool && tool.endsWith && tool.endsWith("_list")) || (tool && tool.includes && tool.includes("channels")) || (tool && tool.includes && tool.includes("repos"))) {
        return { ok: true, items: getSimulatedFeed(platformId).slice(0, 10) };
      }
      if (tool === "post" || (tool && tool.includes && tool.includes("message")) || (tool && tool.includes && tool.includes("create")) || (tool && tool.includes && tool.includes("comment"))) {
        return { ok: true, id: `${platformId}_sim_${Date.now()}`, status: "posted", params };
      }
      if (tool === "get" || (tool && tool.includes && tool.includes("get_page")) || (tool && tool.includes && tool.includes("fetch"))) {
        const items = getSimulatedFeed(platformId);
        return { ok: true, item: items[0] || null };
      }
      // Default stub
      return { ok: true, tool, params, note: "simulated" };
    }
  };
}

export default createStubAdapter;
