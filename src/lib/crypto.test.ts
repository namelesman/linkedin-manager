import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { decrypt, encrypt } from "./crypto";

beforeAll(() => {
  process.env.TOKEN_ENC_KEY = randomBytes(32).toString("base64");
});

describe("crypto", () => {
  it("criptografa e descriptografa", () => {
    const payload = encrypt("token-secreto");
    expect(payload).not.toContain("token-secreto");
    expect(decrypt(payload)).toBe("token-secreto");
  });

  it("gera IV diferente a cada chamada", () => {
    expect(encrypt("x")).not.toBe(encrypt("x"));
  });

  it("rejeita payload adulterado", () => {
    const [v, iv, tag, ct] = encrypt("abc").split(":");
    const tampered = Buffer.from(ct, "base64url");
    tampered[0] ^= 1;
    expect(() => decrypt([v, iv, tag, tampered.toString("base64url")].join(":"))).toThrow();
  });
});
