"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export type FormState = { ok?: boolean; error?: string };

export async function saveVoiceTone(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const voiceTone = String(formData.get("voiceTone") ?? "").trim();
  if (voiceTone.length > 2000) return { error: "Use no máximo 2000 caracteres." };

  await db.user.update({ where: { id: user.id }, data: { voiceTone } });
  revalidatePath("/configuracoes");
  return { ok: true };
}
