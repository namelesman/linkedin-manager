"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { DraftError, generateDraft } from "@/lib/ai";
import type { FormState } from "./settings";

export async function createDraft(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const briefing = String(formData.get("briefing") ?? "").trim();
  if (briefing.length < 10) return { error: "Descreva o tema com pelo menos 10 caracteres." };
  if (briefing.length > 5000) return { error: "Use no máximo 5000 caracteres no briefing." };

  let text;
  try {
    text = await generateDraft(briefing, user.voiceTone);
  } catch (error) {
    if (error instanceof DraftError) return { error: error.message };
    throw error;
  }

  const post = await db.post.create({ data: { userId: user.id, briefing, text } });
  redirect(`/posts/${post.id}`);
}
