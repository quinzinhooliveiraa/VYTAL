import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_HEX = process.env.ENCRYPTION_KEY || "";

function getKey(): Buffer {
  if (!KEY_HEX || KEY_HEX.length < 64) {
    throw new Error("ENCRYPTION_KEY não configurada ou inválida. Configure uma chave hex de 32 bytes (64 chars).");
  }
  return Buffer.from(KEY_HEX, "hex");
}

export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `enc:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(value: string): string {
  if (!value) return value;
  if (!value.startsWith("enc:")) return value;
  try {
    const key = getKey();
    const parts = value.split(":");
    if (parts.length !== 4) return value;
    const [, ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encrypted).toString("utf8") + decipher.final("utf8");
  } catch {
    return value;
  }
}
