"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { SESSION_COOKIE } from "@/lib/cookies";
import { DELETE_CONFIRM_WORD } from "@/lib/limits";
import type { FormState } from "./settings";

// Eliminação (LGPD art. 18, VI): apaga conta, token, sessões, posts, imagens e registros de acesso.
// Posts já publicados continuam no LinkedIn; esses o titular apaga por lá.
export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (String(formData.get("confirm") ?? "").trim() !== DELETE_CONFIRM_WORD) {
    return { error: `Digite ${DELETE_CONFIRM_WORD} para confirmar.` };
  }

  // Cascade no schema remove LinkedInAccount, Session, Post, PostImage e AccessLog.
  await db.user.delete({ where: { id: user.id } });
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login?erro=conta-apagada");
}
