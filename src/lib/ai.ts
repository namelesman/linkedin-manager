import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { LINKEDIN_MAX_CHARS } from "@/lib/limits";

const MODEL = "claude-sonnet-5-5";

const client = new Anthropic();

const SYSTEM = `Você escreve posts para o perfil pessoal de LinkedIn do autor, em português do Brasil, na voz dele.

Regras:
- Responda só com o texto do post, pronto para colar. Sem título, sem comentários sobre o texto, sem aspas em volta.
- O LinkedIn não renderiza Markdown: nada de **negrito**, # títulos ou listas com "-". Use parágrafos curtos e quebras de linha.
- No máximo ${LINKEDIN_MAX_CHARS} caracteres. Prefira 800 a 1500.
- Não invente fatos, números, clientes ou resultados que não estejam no briefing.
- Hashtags: no máximo 3, no final, só se fizerem sentido.`;

export class DraftError extends Error {}

export async function generateDraft(briefing: string, voiceTone: string): Promise<string> {
  const tone = voiceTone.trim() || "Profissional, direto e próximo, sem jargão corporativo.";

  let response;
  try {
    response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: "medium" },
      // Se o modelo recusar por política, a API refaz a chamada num modelo de fallback.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Tom de voz do autor:\n${tone}\n\nBriefing do post:\n${briefing}`,
        },
      ],
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) throw new DraftError("Limite da Claude API atingido. Tente em instantes.");
    if (error instanceof Anthropic.AuthenticationError) throw new DraftError("ANTHROPIC_API_KEY inválida.");
    if (error instanceof Anthropic.APIError) throw new DraftError(`Erro da Claude API (${error.status ?? "rede"}).`);
    throw error;
  }

  if (response.stop_reason === "refusal") throw new DraftError("O modelo recusou este briefing. Reformule e tente de novo.");

  const text = response.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("")
    .trim();
  if (!text) throw new DraftError("A resposta veio vazia. Tente de novo.");
  return text;
}
