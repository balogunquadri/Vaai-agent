import type { Adapter } from "./adapter";
import { whatsappManager } from "@/lib/whatsapp";

async function getRecentItems(userId: string, limit = 5, userState: any = {}) {
  try {
    // Return cached chats via manager
    const status = whatsappManager.getStatus(userId);
    if (status.state !== "connected") return [];
    const result = await whatsappManager.executeMcp(userId, "whatsapp_get_recent_messages", { limit });
    return Array.isArray(result) ? result.slice(0, limit) : [];
  } catch (err) {
    console.error("whatsappAdapter getRecentItems error:", err);
    return [];
  }
}

async function executeTool(userId: string, toolName: string, args: any = {}, userState: any = {}) {
  try {
    return await whatsappManager.executeMcp(userId, toolName, args || {});
  } catch (err) {
    console.error("whatsappAdapter executeTool error:", err);
    throw err;
  }
}

const whatsappAdapter: Adapter = { getRecentItems, executeTool };

export default whatsappAdapter;
