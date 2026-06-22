import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { encryptString, decryptString } from "./crypto";
import { createAdminClient } from "@insforge/sdk";

const apiId = Number(process.env.TELEGRAM_API_ID || 0);
const apiHash = process.env.TELEGRAM_API_HASH || "";

async function getAdmin() {
  return createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
}

export async function sendCodeRequest(userId: string, phoneNumber: string) {
  if (!apiId || !apiHash) throw new Error("Missing TELEGRAM_API_ID or TELEGRAM_API_HASH env vars");

  const client = new TelegramClient(new StringSession("") as any, apiId, apiHash, { connectionRetries: 1 });
  await client.connect();

  try {
    // gramjs/telegram client's sendCode API may vary; use dynamic calls to support multiple client libs
    const result = await (client as any).sendCode ? await (client as any).sendCode(phoneNumber) : await (client as any).requestCode?.(phoneNumber);
    // persist temporary request state so verify can reconstruct if needed
    const admin = await getAdmin();
    // update if row exists, otherwise insert (compatible with InsForge admin client)
    const tempRow = {
      user_id: userId,
      platform: "telegram_temp",
      connected: false,
      state: { phoneNumber, phone_code_hash: result.phoneCodeHash, created_at: new Date().toISOString() }
    };
    try {
      const { data: updated } = await admin.database.from("integrations").update({ ...tempRow, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("platform", "telegram_temp");
      if (!updated || (Array.isArray(updated) && (updated as any).length === 0)) {
        await admin.database.from("integrations").insert([tempRow]);
      }
    } catch (e) {
      // fallback to insert
      await admin.database.from("integrations").insert([tempRow]);
    }

    return { ok: true };
  } finally {
    try { await client.disconnect(); } catch (_) {}
  }
}

export async function verifyCodeAndCreateSession(userId: string, phoneNumber: string, code: string) {
  if (!apiId || !apiHash) throw new Error("Missing TELEGRAM_API_ID or TELEGRAM_API_HASH env vars");
  const admin = await getAdmin();
  const { data: temp } = await admin.database.from("integrations").select("state,id").eq("user_id", userId).eq("platform", "telegram_temp").maybeSingle();
  const phoneCodeHash = temp?.state?.phone_code_hash;

  const client = new TelegramClient(new StringSession("") as any, apiId, apiHash, { connectionRetries: 1 });
  await client.connect();

  try {
    try {
      const signInResult = await (client as any).signIn ? await (client as any).signIn({ phoneNumber, phoneCode: code, phoneCodeHash }) : await (client as any).completeLogin?.(phoneNumber, code, phoneCodeHash);
      // after successful sign-in, extract session string
      const sessionStr = (client.session as any).save();
      const encrypted = encryptString(sessionStr);

      // persist session into integrations table (update else insert)
      const finalRow = {
        user_id: userId,
        platform: "telegram",
        connected: true,
        state: { session: encrypted, phoneNumber, last_connected_at: new Date().toISOString() }
      };
      try {
        const { data: updated } = await admin.database.from("integrations").update({ ...finalRow, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("platform", "telegram");
        if (!updated || (Array.isArray(updated) && (updated as any).length === 0)) {
          await admin.database.from("integrations").insert([finalRow]);
        }
      } catch (e) {
        await admin.database.from("integrations").insert([finalRow]);
      }

      // cleanup temp
      await admin.database.from("integrations").delete().eq("user_id", userId).eq("platform", "telegram_temp");

      return { success: true };
    } catch (err: any) {
      // SESSION_PASSWORD_NEEDED indicates 2FA is required
      const needsPassword = err?.error === "SESSION_PASSWORD_NEEDED" || err?.message?.includes("SESSION_PASSWORD_NEEDED");
      if (needsPassword) {
        return { needPassword: true };
      }
      throw err;
    }
  } finally {
    try { await client.disconnect(); } catch (_) {}
  }
}

export async function verifyPassword(userId: string, password: string) {
  if (!apiId || !apiHash) throw new Error("Missing TELEGRAM_API_ID or TELEGRAM_API_HASH env vars");
  const admin = await getAdmin();
  // Read temp to get phoneNumber
  const { data: temp } = await admin.database.from("integrations").select("state").eq("user_id", userId).eq("platform", "telegram_temp").maybeSingle();
  const phoneNumber = temp?.state?.phoneNumber;

  const client = new TelegramClient(new StringSession("") as any, apiId, apiHash, { connectionRetries: 1 });
  await client.connect();

  try {
    // attempt password signIn/check (dynamic method names)
    const pwResult = (client as any).checkPassword ? await (client as any).checkPassword(password) : await (client as any).signInWithPassword?.(password);
    // if successful, save session like above
    const sessionStr = (client.session as any).save();
    const encrypted = encryptString(sessionStr);
    const finalRow = {
      user_id: userId,
      platform: "telegram",
      connected: true,
      state: { session: encrypted, phoneNumber, last_connected_at: new Date().toISOString() }
    };
    try {
      const { data: updated } = await admin.database.from("integrations").update({ ...finalRow, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("platform", "telegram");
      if (!updated || (Array.isArray(updated) && (updated as any).length === 0)) {
        await admin.database.from("integrations").insert([finalRow]);
      }
    } catch (e) {
      await admin.database.from("integrations").insert([finalRow]);
    }
    await admin.database.from("integrations").delete().eq("user_id", userId).eq("platform", "telegram_temp");
    return { success: true };
  } finally {
    try { await client.disconnect(); } catch (_) {}
  }
}

export async function disconnectTelegram(userId: string) {
  const admin = await getAdmin();
  await admin.database.from("integrations").update({ connected: false, state: null, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("platform", "telegram");
  return { ok: true };
}

export async function getTelegramStatus(userId: string) {
  const admin = await getAdmin();
  const { data } = await admin.database.from("integrations").select("state,connected").eq("user_id", userId).eq("platform", "telegram").maybeSingle();
  if (!data) return { connected: false };
  return { connected: !!data.connected, state: data.state };
}

export async function createClientFromSessionEncrypted(encryptedSession: string) {
  const decrypted = decryptString(encryptedSession);
  if (!decrypted) throw new Error("Failed to decrypt Telegram session");
  const client = new TelegramClient(new StringSession(decrypted) as any, apiId, apiHash, { connectionRetries: 1 });
  await client.connect();
  return client;
}

export default { sendCodeRequest, verifyCodeAndCreateSession, verifyPassword, disconnectTelegram, getTelegramStatus, createClientFromSessionEncrypted };
