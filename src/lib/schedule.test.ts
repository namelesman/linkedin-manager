import { describe, expect, it } from "vitest";
import { isValidCronAuth, parseLocalDateTime, toLocalInputValue } from "./schedule";

describe("parseLocalDateTime", () => {
  it("interpreta o horário como Brasília (UTC-3)", () => {
    expect(parseLocalDateTime("2026-10-30T09:00")?.toISOString()).toBe("2026-10-30T12:00:00.000Z");
  });

  it("recusa formatos inválidos", () => {
    expect(parseLocalDateTime("")).toBeNull();
    expect(parseLocalDateTime("30/10/2026 09:00")).toBeNull();
    expect(parseLocalDateTime("2026-13-40T99:99")).toBeNull();
  });

  it("faz ida e volta com o valor do input", () => {
    expect(toLocalInputValue(parseLocalDateTime("2026-12-31T23:30")!)).toBe("2026-12-31T23:30");
  });
});

describe("isValidCronAuth", () => {
  it("aceita só o bearer exato", () => {
    expect(isValidCronAuth("Bearer s3cret", "s3cret")).toBe(true);
    expect(isValidCronAuth("Bearer errado", "s3cret")).toBe(false);
    expect(isValidCronAuth("s3cret", "s3cret")).toBe(false);
    expect(isValidCronAuth(null, "s3cret")).toBe(false);
  });

  it("recusa tudo se CRON_SECRET não estiver configurado", () => {
    expect(isValidCronAuth("Bearer ", "")).toBe(false);
  });
});
