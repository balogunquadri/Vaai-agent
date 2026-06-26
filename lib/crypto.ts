import crypto from "crypto";

const getEncryptionKey = (): Buffer => {
  const rawSecret = process.env.INSFORGE_KEY_SECRET || "fallback_dev_secret_key_mcp_v-ai";
  return crypto.createHash("sha256").update(rawSecret).digest();
};

/**
 * Encrypts cleartext using AES-256-GCM
 */
export function encrypt(text: string): string {
  try {
    if (!text) return "";
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const tag = cipher.getAuthTag().toString("hex");
    
    return `${iv.toString("hex")}:${tag}:${encrypted}`;
  } catch (err) {
    console.error("[Crypto] Encryption failed:", err);
    throw new Error("Failed to encrypt token.");
  }
}

/**
 * Decrypts ciphertext using AES-256-GCM. 
 * Falls back to returning original text if it's not encrypted (supports token migration).
 */
export function decrypt(cipherText: string): string {
  try {
    if (!cipherText) return "";
    
    const parts = cipherText.split(":");
    if (parts.length !== 3) {
      // Not in the standard IV:TAG:ENCRYPTED format, assume raw unencrypted token
      return cipherText;
    }

    const [ivHex, tagHex, encryptedText] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (err) {
    console.warn("[Crypto] Decryption failed, assuming raw token fallback:", err);
    return cipherText;
  }
}

export const encryptString = encrypt;
export const decryptString = decrypt;

