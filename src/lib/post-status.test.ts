import { describe, expect, it } from "vitest";
import { canApprove, canDelete, canEdit, canPublish, canSchedule } from "./post-status";

describe("post-status", () => {
  it("só publica post aprovado", () => {
    expect(canPublish("APPROVED")).toBe(true);
    for (const s of ["DRAFT", "SCHEDULED", "PUBLISHING", "PUBLISHED", "ERROR"] as const) {
      expect(canPublish(s)).toBe(false);
    }
  });

  it("não edita nem apaga o que está saindo ou já saiu", () => {
    expect(canEdit("PUBLISHING")).toBe(false);
    expect(canEdit("PUBLISHED")).toBe(false);
    expect(canDelete("PUBLISHING")).toBe(false);
  });

  it("aprova rascunho e post com erro, agenda só aprovado", () => {
    expect(canApprove("DRAFT")).toBe(true);
    expect(canApprove("ERROR")).toBe(true);
    expect(canApprove("APPROVED")).toBe(false);
    expect(canSchedule("APPROVED")).toBe(true);
    expect(canSchedule("DRAFT")).toBe(false);
  });
});
