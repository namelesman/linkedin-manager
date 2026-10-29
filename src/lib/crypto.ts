import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const VERSION = "v1";

function key(): Buffer {
  const raw = process.env.TOKEN_ENC_KEY;
  if (!raw) throw new Error("TOKEN_ENC_KEY não configurada");
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new Error("TOKEN_ENC_KEY deve ter 32 bytes em base64");
  return buf;
}

// Formato: v1:<iv>:<tag>:<ciphertext>, tudo em base64url.
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv, tag, ct].map((p) => (typeof p === "string" ? p : p.toString("base64url"))).join(":");
}

export function decrypt(payload: string): string {
  const [version, iv, tag, ct] = payload.split(":");
  if (version !== VERSION || !iv || !tag || !ct) throw new Error("Payload criptografado inválido");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ct, "base64url")), decipher.final()]).toString("utf8");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
