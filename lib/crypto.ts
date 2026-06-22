import crypto from "crypto";

const ALGO = "aes-256-gcm";

function getKey() {
  const secret = process.env.INTEGRATION_KEY || process.env.NEXT_PUBLIC_INTEGRATION_KEY || "";
  // Derive 32-byte key
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptString(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(plain, "utf8")), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decryptString(token: string): string | null {
  try {
    const key = getKey();
    const buf = Buffer.from(token, "base64");
    const iv = buf.slice(0, 12);
    const tag = buf.slice(12, 28);
    const ciphertext = buf.slice(28);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
    return plain;
  } catch (err) {
    console.error("decryptString failed:", err);
    return null;
  }
}

export default { encryptString, decryptString };
