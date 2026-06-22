import makeWASocket, {
  AuthenticationState,
  AuthenticationCreds,
  BufferJSON,
  initAuthCreds,
  DisconnectReason,
  proto,
  Browsers,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import pino from "pino";
import { Boom } from "@hapi/boom";
import { createAdminClient } from "@insforge/sdk";

// Helper for database authentication state persistence in InsForge
async function useDbAuthState(userId: string) {
  const admin = createAdminClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL || "https://5838ur4e.us-east.insforge.app",
    apiKey: process.env.INSFORGE_API_KEY || "ik_5fbb1830e22e71d63fb6636621247b3e",
  });

  const getSessionData = async () => {
    try {
      const { data } = await admin.database
        .from("integrations")
        .select("state")
        .eq("user_id", userId)
        .eq("platform", "whatsapp")
        .maybeSingle();
      return data?.state || {};
    } catch (e) {
      console.error("Error reading WhatsApp auth from DB:", e);
      return {};
    }
  };

  const saveSessionData = async (stateData: any) => {
    try {
      const { data: existing } = await admin.database
        .from("integrations")
        .select("id")
        .eq("user_id", userId)
        .eq("platform", "whatsapp")
        .maybeSingle();

      if (existing) {
        await admin.database
          .from("integrations")
          .update({
            state: stateData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await admin.database.from("integrations").insert([
          {
            user_id: userId,
            platform: "whatsapp",
            connected: false,
            state: stateData,
          },
        ]);
      }
    } catch (e) {
      console.error("Error saving WhatsApp auth to DB:", e);
    }
  };

  const session = await getSessionData();

  let creds: AuthenticationCreds;
  if (session.creds) {
    creds = JSON.parse(JSON.stringify(session.creds), BufferJSON.reviver);
  } else {
    creds = initAuthCreds();
  }

  const keys = session.keys || {};

  const state: AuthenticationState = {
    creds,
    keys: {
      get: (type, ids) => {
        const data: { [id: string]: any } = {};
        for (const id of ids) {
          const value = keys[`${type}-${id}`];
          if (value) {
            data[id] = JSON.parse(JSON.stringify(value), BufferJSON.reviver);
          }
        }
        return data;
      },
      set: async (data: any) => {
        for (const type in data) {
          for (const id in data[type]) {
            const value = data[type][id];
            if (value) {
              keys[`${type}-${id}`] = JSON.parse(JSON.stringify(value), BufferJSON.replacer);
            } else {
              delete keys[`${type}-${id}`];
            }
          }
        }
        await saveSessionData({
          creds: JSON.parse(JSON.stringify(creds), BufferJSON.replacer),
          keys
        });
      }
    }
  };

  return {
    state,
    saveCreds: async () => {
      await saveSessionData({
        creds: JSON.parse(JSON.stringify(state.creds), BufferJSON.replacer),
        keys
      });
    }
  };
}

interface ChatSession {
  id: string;
  name: string;
  lastMessage?: string;
  timestamp?: number;
  isGroup: boolean;
}

interface MessageSession {
  id: string;
  from: string;
  body: string;
  timestamp: number;
}

class WhatsAppManager {
  private activeSockets: Map<string, any> = new Map();
  private pairingCodes: Map<string, string> = new Map();
  private connectionStates: Map<string, "disconnected" | "connecting" | "connected"> = new Map();

  // Real-time chat & message history cache
  private chatCache: Map<string, ChatSession[]> = new Map();
  private messageCache: Map<string, Map<string, MessageSession[]>> = new Map();

  private setupGlobalHandlers(userId: string, sock: any, saveCreds: any) {
    sock.ev.on("connection.update", async (update: any) => {
      const { connection, lastDisconnect } = update;
      
      if (connection === "close") {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log(`WhatsApp connection closed for user ${userId}. Reconnecting:`, shouldReconnect);
        
        this.connectionStates.set(userId, "disconnected");
        this.activeSockets.delete(userId);
        this.pairingCodes.delete(userId);

        const admin = createAdminClient({
          baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL || "https://5838ur4e.us-east.insforge.app",
          apiKey: process.env.INSFORGE_API_KEY || "ik_5fbb1830e22e71d63fb6636621247b3e",
        });

        if (!shouldReconnect) {
          // Logged out: Wipe DB session state completely
          await admin.database
            .from("integrations")
            .update({ connected: false, state: null, updated_at: new Date().toISOString() })
            .eq("user_id", userId)
            .eq("platform", "whatsapp");
        } else {
          // Connection drop: Update table status but keep state
          await admin.database
            .from("integrations")
            .update({ connected: false, updated_at: new Date().toISOString() })
            .eq("user_id", userId)
            .eq("platform", "whatsapp");
            
          // Automatically attempt to reconnect if connection dropped unexpectedly
          setTimeout(() => {
            console.log(`Attempting automatic reconnection for user ${userId}...`);
            this.connect(userId).catch(err => console.error(`Failed to auto-reconnect user ${userId}:`, err));
          }, 5000);
        }
      } else if (connection === "open") {
        console.log(`WhatsApp connection opened successfully for user ${userId}`);
        this.connectionStates.set(userId, "connected");
        this.pairingCodes.delete(userId);

        const admin = createAdminClient({
          baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL || "https://5838ur4e.us-east.insforge.app",
          apiKey: process.env.INSFORGE_API_KEY || "ik_5fbb1830e22e71d63fb6636621247b3e",
        });

        // Set connected: true
        await admin.database
          .from("integrations")
          .update({ connected: true, updated_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("platform", "whatsapp");
      }
    });

    // Cache messaging history and new chats
    sock.ev.on("messaging-history.set", ({ chats, messages }: any) => {
      const userChats: ChatSession[] = chats.map((c: any) => ({
        id: c.id,
        name: c.name || c.id.split("@")[0],
        isGroup: c.id.endsWith("@g.us"),
      }));
      this.chatCache.set(userId, userChats);

      const userMsgs = new Map<string, MessageSession[]>();
      messages.forEach((m: any) => {
        const jid = m.key.remoteJid;
        if (!jid) return;
        const msgText = m.message?.conversation || m.message?.extendedTextMessage?.text || "";
        if (!msgText) return;

        const chatMsgs = userMsgs.get(jid) || [];
        chatMsgs.push({
          id: m.key.id || String(Math.random()),
          from: m.key.fromMe ? "Me" : jid.split("@")[0],
          body: msgText,
          timestamp: Number(m.messageTimestamp) * 1000,
        });
        userMsgs.set(jid, chatMsgs);
      });
      this.messageCache.set(userId, userMsgs);
    });

    sock.ev.on("messages.upsert", ({ messages, type }: any) => {
      if (type !== "notify") return;
      
      const userMsgs = this.messageCache.get(userId) || new Map<string, MessageSession[]>();
      messages.forEach((m: any) => {
        const jid = m.key.remoteJid;
        if (!jid) return;
        const msgText = m.message?.conversation || m.message?.extendedTextMessage?.text || "";
        if (!msgText) return;

        const chatMsgs = userMsgs.get(jid) || [];
        chatMsgs.push({
          id: m.key.id || String(Math.random()),
          from: m.key.fromMe ? "Me" : jid.split("@")[0],
          body: msgText,
          timestamp: Number(m.messageTimestamp) * 1000,
        });
        userMsgs.set(jid, chatMsgs);

        // Update chatCache lastMessage
        const chats = this.chatCache.get(userId) || [];
        const chatIdx = chats.findIndex((c) => c.id === jid);
        if (chatIdx !== -1) {
          chats[chatIdx].lastMessage = msgText;
          chats[chatIdx].timestamp = Number(m.messageTimestamp) * 1000;
        } else {
          chats.unshift({
            id: jid,
            name: jid.split("@")[0],
            isGroup: jid.endsWith("@g.us"),
            lastMessage: msgText,
            timestamp: Number(m.messageTimestamp) * 1000,
          });
        }
        this.chatCache.set(userId, chats);
      });
      this.messageCache.set(userId, userMsgs);
    });
  }

  async connect(userId: string, phoneNumber?: string): Promise<string | null> {
    if (this.activeSockets.has(userId)) {
      const state = this.connectionStates.get(userId) || "disconnected";
      if (state === "connected") return null;
      if (state === "connecting" && this.pairingCodes.has(userId)) {
        return this.pairingCodes.get(userId) || null;
      }
    }

    // 1. Wipe database session state and clear local caches if requesting a new pairing code.
    // This prevents WhatsApp's server from dropping the connection (Error 428) due to outdated or corrupted credential keys.
    if (phoneNumber) {
      console.log(`Wiping WhatsApp session state for user ${userId} to ensure fresh pairing...`);
      this.chatCache.delete(userId);
      this.messageCache.delete(userId);
      this.pairingCodes.delete(userId);
      
      const admin = createAdminClient({
        baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL || "https://5838ur4e.us-east.insforge.app",
        apiKey: process.env.INSFORGE_API_KEY || "ik_5fbb1830e22e71d63fb6636621247b3e",
      });
      await admin.database
        .from("integrations")
        .update({ state: {}, connected: false, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("platform", "whatsapp");
    }

    // Fetch the latest WhatsApp Web version to match WhatsApp's server requirements
    let waVersion: any = undefined;
    try {
      const latest = await fetchLatestBaileysVersion();
      waVersion = latest.version;
      console.log(`Using WhatsApp Web protocol version: ${waVersion.join(".")}`);
    } catch (err) {
      console.warn("Could not fetch latest Baileys version, falling back to library defaults:", err);
    }

    let attempts = 0;
    const maxAttempts = 5;
    let lastError: any = null;
    let pairingCode: string | null = null;

    while (attempts < maxAttempts) {
      attempts++;
      this.connectionStates.set(userId, "connecting");
      
      const { state, saveCreds } = await useDbAuthState(userId);
      const logger = pino({ level: "silent" });
      const sock = makeWASocket({
        version: waVersion,
        auth: state,
        logger,
        printQRInTerminal: false,
        browser: Browsers.ubuntu("Chrome"),
      });

      this.activeSockets.set(userId, sock);

      // Register credentials update handler immediately
      sock.ev.on("creds.update", saveCreds);

      // Connection promise waits for QR or open state, rejecting on close or timeout
      const connectionPromise = new Promise<void>((resolve, reject) => {
        const onUpdate = (update: any) => {
          const { connection, lastDisconnect, qr } = update;
          
          if (connection === "close") {
            const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
            sock.ev.off("connection.update", onUpdate);
            reject(new Error(`Connection closed during setup with status: ${statusCode}`));
          } else if (qr) {
            sock.ev.off("connection.update", onUpdate);
            resolve();
          } else if (connection === "open") {
            sock.ev.off("connection.update", onUpdate);
            resolve();
          }
        };
        sock.ev.on("connection.update", onUpdate);
        
        // Timeout after 12 seconds to prevent hanging
        setTimeout(() => {
          sock.ev.off("connection.update", onUpdate);
          reject(new Error("Connection setup timed out."));
        }, 12000);
      });

      try {
        // Wait for connection to be ready (QR generated or connection opened)
        await connectionPromise;

        if (sock.authState.creds.registered) {
          this.connectionStates.set(userId, "connected");
          this.setupGlobalHandlers(userId, sock, saveCreds);
          return null;
        }

        if (phoneNumber) {
          const cleanPhone = phoneNumber.replace(/\D/g, "");
          
          // Small safety buffer before requesting pairing code to stabilize WS connection
          await new Promise((resolve) => setTimeout(resolve, 2000));
          
          pairingCode = await sock.requestPairingCode(cleanPhone);
          this.pairingCodes.set(userId, pairingCode);
          
          this.setupGlobalHandlers(userId, sock, saveCreds);
          return pairingCode;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Connection Attempt ${attempts}/${maxAttempts}] failed for user ${userId}:`, err.message);
        
        // Clean up socket for this failed attempt
        try {
          sock.end(undefined);
        } catch (_) {}
        
        this.activeSockets.delete(userId);
        this.connectionStates.set(userId, "disconnected");
        
        if (attempts >= maxAttempts) {
          break;
        }
        
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
    }

    throw lastError || new Error("Failed to establish WhatsApp connection after maximum attempts.");
  }

  async disconnect(userId: string) {
    const sock = this.activeSockets.get(userId);
    if (sock) {
      try {
        await sock.logout();
      } catch (e) {
        console.warn("Logout error:", e);
      }
      sock.end(undefined);
    }
    this.activeSockets.delete(userId);
    this.connectionStates.set(userId, "disconnected");
    this.pairingCodes.delete(userId);
    this.chatCache.delete(userId);
    this.messageCache.delete(userId);

    const admin = createAdminClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL || "https://5838ur4e.us-east.insforge.app",
      apiKey: process.env.INSFORGE_API_KEY || "ik_5fbb1830e22e71d63fb6636621247b3e",
    });

    await admin.database
      .from("integrations")
      .update({ connected: false, state: null, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("platform", "whatsapp");
  }

  getStatus(userId: string) {
    const state = this.connectionStates.get(userId) || "disconnected";
    const code = this.pairingCodes.get(userId) || null;
    return { state, pairingCode: code };
  }

  async executeMcp(userId: string, toolName: string, args: any): Promise<any> {
    const sock = this.activeSockets.get(userId);
    const state = this.connectionStates.get(userId);

    if (!sock || state !== "connected") {
      throw new Error("WhatsApp socket is not connected for this user session.");
    }

    const chats = this.chatCache.get(userId) || [];
    const userMsgs = this.messageCache.get(userId) || new Map<string, MessageSession[]>();

    switch (toolName) {
      case "whatsapp_get_recent_messages":
        // Fetch last message for all chats
        return chats.map((c) => ({
          chatId: c.id,
          name: c.name,
          lastMessage: c.lastMessage || "No messages",
          timestamp: c.timestamp ? new Date(c.timestamp).toLocaleString() : "N/A",
          isGroup: c.isGroup
        }));

      case "whatsapp_read_chat_history": {
        const jid = args.chatId || args.jid;
        if (!jid) throw new Error("Missing chatId parameter");
        const list = userMsgs.get(jid) || [];
        return { chatId: jid, messages: list };
      }

      case "whatsapp_send_message": {
        const to = args.to || args.jid;
        const text = args.message || args.text;
        if (!to || !text) throw new Error("Missing 'to' or 'message' parameter");

        // Ensure jid format
        const formattedJid = to.includes("@") ? to : `${to.replace(/\D/g, "")}@s.whatsapp.net`;
        await sock.sendMessage(formattedJid, { text });

        return { success: true, sentTo: formattedJid, message: text };
      }

      case "whatsapp_search_chats": {
        const query = (args.query || "").toLowerCase();
        if (!query) throw new Error("Missing query search string");
        return chats.filter((c) => c.name.toLowerCase().includes(query) || c.id.toLowerCase().includes(query));
      }

      case "whatsapp_list_groups":
        return chats.filter((c) => c.isGroup);

      case "whatsapp_fetch_group_messages": {
        const groupId = args.groupId || args.jid;
        if (!groupId || !groupId.endsWith("@g.us")) throw new Error("Invalid or missing groupId parameter");
        return userMsgs.get(groupId) || [];
      }

      case "whatsapp_send_group_message": {
        const groupId = args.groupId || args.jid;
        const text = args.message || args.text;
        if (!groupId || !groupId.endsWith("@g.us") || !text) throw new Error("Invalid or missing parameters");
        await sock.sendMessage(groupId, { text });
        return { success: true, sentTo: groupId, message: text };
      }

      case "whatsapp_get_contact_details": {
        const jid = args.jid;
        if (!jid) throw new Error("Missing contact jid");
        return {
          jid,
          name: chats.find((c) => c.id === jid)?.name || jid.split("@")[0],
          isGroup: jid.endsWith("@g.us")
        };
      }

      case "whatsapp_summarize_conversations": {
        const jid = args.chatId || args.jid;
        if (!jid) throw new Error("Missing chatId parameter");
        const list = userMsgs.get(jid) || [];
        if (list.length === 0) return "No messages available to summarize.";
        const summaryText = list.map((m) => `${m.from}: ${m.body}`).join("\n");
        return `Summary of conversation: This thread contains ${list.length} messages. Last message from ${list[list.length - 1]?.from}: "${list[list.length - 1]?.body}"`;
      }

      default:
        throw new Error(`Unknown WhatsApp MCP tool: ${toolName}`);
    }
  }
}

// Global hot-reload cache persistence for Next.js dev server
const globalForWhatsApp = globalThis as unknown as {
  whatsappManager: WhatsAppManager;
};

export const whatsappManager =
  globalForWhatsApp.whatsappManager || new WhatsAppManager();

if (process.env.NODE_ENV !== "production") {
  globalForWhatsApp.whatsappManager = whatsappManager;
}

