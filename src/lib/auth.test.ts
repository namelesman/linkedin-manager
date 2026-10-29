import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { isAllowedEmail } = await import("./linkedin-auth");
const { tokenStatus } = await import("./token-expiry");

describe("isAllowedEmail", () => {
  it("aceita o e-mail configurado sem diferenciar maiúsculas", () => {
    expect(isAllowedEmail("Thiago@Example.com", "thiago@example.com")).toBe(true);
  });

  it("recusa outro e-mail ou configuração vazia", () => {
    expect(isAllowedEmail("outro@example.com", "thiago@example.com")).toBe(false);
    expect(isAllowedEmail("thiago@example.com", "")).toBe(false);
    expect(isAllowedEmail(undefined, "thiago@example.com")).toBe(false);
  });
});

describe("tokenStatus", () => {
  const now = new Date("2026-01-01T00:00:00Z");
  const inDays = (d: number) => new Date(now.getTime() + d * 86_400_000);

  it("classifica pela distância até expirar", () => {
    expect(tokenStatus(inDays(30), now).state).toBe("ok");
    expect(tokenStatus(inDays(3), now).state).toBe("expiring");
    expect(tokenStatus(inDays(-1), now).state).toBe("expired");
    expect(tokenStatus(null, now).state).toBe("missing");
  });
});
