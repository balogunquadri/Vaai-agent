import type { Adapter } from "./adapters/adapter";
import { createAdminClient } from "@insforge/sdk";
import { McpSseClient } from "./services/mcpSseClient";

const adapters: Record<string, Adapter> = {};

export function registerAdapter(platformId: string, adapter: Adapter) {
  adapters[platformId] = adapter;
}

export function getAdapter(platformId: string): Adapter | undefined {
  return adapters[platformId];
}

export function listAdapters(): string[] {
  return Object.keys(adapters);
}

/**
 * Compiles a list of all active tools available for the user (from both local and remote MCP integrations).
 */
export async function listUserTools(userId: string): Promise<any[]> {
  try {
    const admin = createAdminClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      apiKey: process.env.INSFORGE_API_KEY!,
    });

    const { data: integrations, error } = await admin.database
      .from("integrations")
      .select("platform, state, connected")
      .eq("user_id", userId)
      .eq("connected", true);

    if (error || !integrations) {
      return [];
    }

    const allTools: any[] = [];

    for (const integration of integrations) {
      const platformId = integration.platform;
      const state = integration.state || {};

      // Route A: Remote MCP Server (if state contains a serverUrl)
      if (state.serverUrl) {
        console.log(`[MCP Registry] Fetching tools dynamically from remote server: ${state.serverUrl}`);
        const remoteTools = await McpSseClient.listTools(state.serverUrl);
        allTools.push(...remoteTools);
      } else {
        // Route B: Local In-Process Adapter
        const adapter = adapters[platformId];
        if (adapter && adapter.getToolSchemas) {
          try {
            const localTools = await adapter.getToolSchemas(userId);
            allTools.push(...localTools);
          } catch (err) {
            console.error(`[MCP Registry] Failed to get schemas for adapter ${platformId}:`, err);
          }
        }
      }
    }

    return allTools;
  } catch (err) {
    console.error("[MCP Registry] listUserTools failed:", err);
    return [];
  }
}

/**
 * Routes and executes a tool call for the user dynamically
 */
export async function dispatchToolCall(userId: string, toolName: string, args: any): Promise<any> {
  try {
    const admin = createAdminClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      apiKey: process.env.INSFORGE_API_KEY!,
    });

    // Determine platform by tool prefix (e.g. slack_post_message -> slack)
    const platformId = toolName.split("_")[0];

    const { data: integration, error } = await admin.database
      .from("integrations")
      .select("platform, state, connected")
      .eq("user_id", userId)
      .eq("platform", platformId)
      .maybeSingle();

    if (error || !integration || !integration.connected) {
      // If no prefix match, search for a connected remote server that handles this tool
      const { data: allConnected } = await admin.database
        .from("integrations")
        .select("platform, state")
        .eq("user_id", userId)
        .eq("connected", true);
      
      const remoteMatch = allConnected?.find((row: any) => {
        const serverUrl = row.state?.serverUrl;
        return serverUrl;
      });

      if (remoteMatch) {
        console.log(`[MCP Registry] Routing generic tool ${toolName} to remote server: ${remoteMatch.state.serverUrl}`);
        return await McpSseClient.callTool(remoteMatch.state.serverUrl, toolName, args);
      }

      throw new Error(`Integration for platform "${platformId}" is not connected.`);
    }

    const state = integration.state || {};

    if (state.serverUrl) {
      // Execute on remote server
      console.log(`[MCP Registry] Dispatching tool ${toolName} to remote server: ${state.serverUrl}`);
      return await McpSseClient.callTool(state.serverUrl, toolName, args);
    }

    // Execute via local adapter
    const adapter = adapters[platformId];
    if (!adapter || !adapter.executeTool) {
      throw new Error(`Local adapter for platform "${platformId}" does not support executeTool.`);
    }

    console.log(`[MCP Registry] Dispatching tool ${toolName} to local adapter`);
    return await adapter.executeTool(userId, toolName, args, state);

  } catch (err: any) {
    console.error(`[MCP Registry] dispatchToolCall failed for ${toolName}:`, err.message || err);
    throw err;
  }
}

export default { registerAdapter, getAdapter, listAdapters, listUserTools, dispatchToolCall };
