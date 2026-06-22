import crypto from "crypto";

const SECRET = process.env.EMAIL_TOKEN_SECRET || process.env.SECRET || "";
if (!SECRET) console.warn("EMAIL_TOKEN_SECRET not set — email tokens will be insecure");

function base64url(input: Buffer) {
  return input.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function createEmailToken(email: string, type: string, expiresInSeconds = 60 * 60) {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = { email, type, exp };
  const payloadJson = Buffer.from(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", SECRET).update(payloadJson).digest();
  return `${base64url(payloadJson)}.${base64url(signature)}`;
}

export function verifyEmailToken(token: string, expectedType?: string) {
  try {
    const [payloadB64, sigB64] = token.split(".");
    if (!payloadB64 || !sigB64) return null;
    const payloadJson = Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    const payload = JSON.parse(payloadJson.toString("utf8"));
    if (expectedType && payload.type !== expectedType) return null;
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    const expectedSig = crypto.createHmac("sha256", SECRET).update(payloadJson).digest();
    const sig = Buffer.from(sigB64.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    if (!crypto.timingSafeEqual(sig, expectedSig)) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

export default { createEmailToken, verifyEmailToken };
