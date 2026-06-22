import telegramClient from "@/lib/telegramClient";
import { decryptString } from "@/lib/crypto";

export async function validateConfig(state: any) {
  if (!state || !state.session) return false;
  const decrypted = decryptString(state.session);
  return !!decrypted;
}

export async function getRecentItems(userId: string, limit = 5, state: any = {}) {
  try {
    if (!state?.session) return [];
    const client = await telegramClient.createClientFromSessionEncrypted(state.session);
    // simple fallback: try to fetch dialogs (API dependent)
    try {
      const dialogs = await (client as any).getDialogs({ limit });
      return dialogs.map((d: any) => ({ id: d.id?.toString(), title: d.title || d.name || d.id?.toString(), time: Date.now() }));
    } catch (err) {
      // fallback simulated
      return [{ id: "tg_1", title: "Chat with Demo", time: Date.now() }];
    } finally {
      try { await client.disconnect(); } catch (_) {}
    }
  } catch (err) {
    console.error("telegram adapter getRecentItems error:", err);
    return [];
  }
}

export async function executeTool(userId: string, toolName: string, args: any = {}, state: any = {}) {
  if (!state?.session) throw new Error("Telegram not connected");
  const client = await telegramClient.createClientFromSessionEncrypted(state.session);
  try {
    switch (toolName) {
      case "telegram_get_recent_messages": {
        const dialogs = await (client as any).getDialogs({ limit: args.limit || 10 });
        return dialogs;
      }
      case "telegram_send_message": {
        const to = args.chatId || args.to;
        const text = args.text || args.message || "";
        if (!to || !text) throw new Error("Missing chatId or text");
        await (client as any).sendMessage(to, { message: text });
        return { success: true };
      }
      case "telegram_read_chat_history": {
        const chatId = args.chatId;
        if (!chatId) throw new Error("Missing chatId");
        const messages = await (client as any).getMessages(chatId, { limit: args.limit || 50 });
        return messages;
      }
      default:
        throw new Error(`Unknown Telegram tool: ${toolName}`);
    }
  } finally {
    try { await client.disconnect(); } catch (_) {}
  }
}

export const adapter = { validateConfig, getRecentItems, executeTool };

export default adapter;
