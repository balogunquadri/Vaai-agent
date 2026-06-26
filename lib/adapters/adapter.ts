export type Adapter = {
  // Optional: return recent items for feeds
  getRecentItems?: (userId: string, limit?: number, userState?: any) => Promise<any[]>;

  // Optional: execute a named tool for this platform
  executeTool?: (userId: string, toolName: string, args?: any, userState?: any) => Promise<any>;

  // Optional: return schemas for tools supported by this adapter
  getToolSchemas?: (userId: string) => Promise<any[]> | any[];

  // Optional: return an OAuth connect URL for the adapter
  getAuthUrl?: (userId: string) => string | Promise<string>;

  // Optional: handle incoming webhook payloads
  handleWebhook?: (payload: any) => Promise<void>;
};

export default Adapter;
