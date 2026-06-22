import type { Adapter } from "./adapter";
import { getValidGmailToken, extractEmailBody, extractHtmlFallback } from "@/lib/gmail";
import tokenManager from "@/lib/tokenManager";

async function getRecentItems(userId: string, limit = 5, userState: any = {}) {
  try {
    // Ensure tokens are refreshed if necessary
    if (userId) await tokenManager.refreshAndSaveIntegration(userId, "gmail");
    const token = await getValidGmailToken(userId);
    if (!token) return [];

    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${limit}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const list = await res.json();
    if (!list?.messages?.length) return [];

    const ids = list.messages.slice(0, limit).map((m: any) => m.id);
    const items: any[] = [];
    for (const id of ids) {
      try {
        const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const msg = await r.json();
        const headers = msg.payload?.headers || [];
        const subject = headers.find((h: any) => h.name === "Subject")?.value || "(no subject)";
        const from = headers.find((h: any) => h.name === "From")?.value || "";
        const body = extractEmailBody(msg.payload) || extractHtmlFallback(msg.payload) || msg.snippet || "";
        items.push({ id, title: subject, text: body.slice(0, 200), from, time: msg.internalDate ? new Date(Number(msg.internalDate)).toISOString() : new Date().toISOString() });
      } catch (e) {
        console.warn("gmailAdapter: failed to fetch message", id, e);
      }
    }
    return items;
  } catch (err) {
    console.error("gmailAdapter getRecentItems error:", err);
    return [];
  }
}

async function executeTool(userId: string, toolName: string, args: any = {}, userState: any = {}) {
  // Ensure valid token
  if (userId) await tokenManager.refreshAndSaveIntegration(userId, "gmail");
  const token = await getValidGmailToken(userId);
  if (!token) throw new Error("Gmail not connected or token missing");

  if (toolName === "gmail_list_messages") {
    const limit = args.limit || 10;
    return await getRecentItems(userId, limit, userState);
  }

  if (toolName === "gmail_get_message") {
    const id = args.messageId || args.id;
    if (!id) throw new Error("Missing messageId");
    const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const msg = await r.json();
    return msg;
  }

  if (toolName === "gmail_send_message") {
    const to = args.to || args.recipient;
    const subject = args.subject || "(no subject)";
    const body = args.body || args.text || "";
    if (!to) throw new Error("Missing recipient 'to' parameter");

    const raw = `To: ${to}\r\nSubject: ${subject}\r\n\r\n${body}`;
    const encoded = Buffer.from(raw).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw: encoded })
    });
    const data = await res.json();
    if (res.ok) return { success: true, id: data.id };
    throw new Error(data.error?.message || "Failed to send email");
  }

  throw new Error(`Gmail adapter: unknown tool ${toolName}`);
}

const gmailAdapter: Adapter = { getRecentItems, executeTool };

export default gmailAdapter;
