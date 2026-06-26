/**
 * MCP SSE/HTTP JSON-RPC Client
 * Handles connection, dynamic tool reflection, and execution queries for remote MCP servers.
 */
export class McpSseClient {
  /**
   * Fetches the list of tools from a remote HTTP/SSE MCP server using standard JSON-RPC 2.0
   */
  static async listTools(serverUrl: string): Promise<any[]> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000); // 4-second timeout limit

      const res = await fetch(`${serverUrl}/tools`, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/list",
          params: {},
          id: 1
        })
      });
      clearTimeout(id);

      if (!res.ok) {
        // Fallback to direct GET /tools endpoint mapping
        const getRes = await fetch(`${serverUrl}/tools`, { headers: { "Accept": "application/json" } });
        if (getRes.ok) {
          const data = await getRes.json();
          return data.tools || data;
        }
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      return data.result?.tools || data.tools || [];
    } catch (err) {
      console.warn(`[MCP Client] listTools failed for server: ${serverUrl}. Error:`, err);
      return [];
    }
  }

  /**
   * Invokes/Calls a specific tool on a remote HTTP/SSE MCP server
   */
  static async callTool(serverUrl: string, toolName: string, args: any): Promise<any> {
    const res = await fetch(`${serverUrl}/tools/call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args
        },
        id: Date.now()
      })
    });

    if (!res.ok) {
      throw new Error(`MCP remote tool call failed with status: ${res.status}`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error.message || `Remote MCP Error: ${JSON.stringify(data.error)}`);
    }

    return data.result || data;
  }
}
