import { describe, expect, it } from "vitest";
import { escapeLittle, toCommentary } from "./little-text";

describe("little text", () => {
  it("escapa todos os reservados", () => {
    expect(escapeLittle("a (b) [c] {d} <e> @f #g *h _i ~j |k \\l")).toBe(
      "a \\(b\\) \\[c\\] \\{d\\} \\<e\\> \\@f \\#g \\*h \\_i \\~j \\|k \\\\l",
    );
  });

  it("preserva texto comum e quebras de linha", () => {
    expect(toCommentary("Olá, mundo!\n\nSegunda linha.")).toBe("Olá, mundo!\n\nSegunda linha.");
  });

  it("transforma hashtags em template e escapa o resto", () => {
    expect(toCommentary("Dica (rápida) #engenharia_de_software\n#TypeScript")).toBe(
      "Dica \\(rápida\\) {hashtag|\\#|engenharia\\_de\\_software}\n{hashtag|\\#|TypeScript}",
    );
  });

  it("não trata # no meio de palavra como hashtag", () => {
    expect(toCommentary("C# e item#2")).toBe("C\\# e item\\#2");
  });
});
