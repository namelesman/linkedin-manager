"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { DraftError, generateDraft } from "@/lib/ai";
import { LINKEDIN_MAX_CHARS } from "@/lib/limits";
import { canApprove, canDelete, canEdit, canPublish } from "@/lib/post-status";
import { publishPost } from "@/lib/publisher";
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

async function getOwnPost(id: string) {
  const user = await requireUser();
  const post = await db.post.findFirst({ where: { id, userId: user.id } });
  if (!post) redirect("/");
  return { user, post };
}

export async function savePostText(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { post } = await getOwnPost(id);
  if (!canEdit(post.status)) return { error: "Este post não pode mais ser editado." };

  const text = String(formData.get("text") ?? "").trim();
  if (text.length > LINKEDIN_MAX_CHARS) return { error: `O LinkedIn aceita até ${LINKEDIN_MAX_CHARS} caracteres.` };
  if (text === post.text) return { ok: true };

  // Mudou o texto: precisa de nova aprovação manual (e perde o agendamento).
  await db.post.update({
    where: { id },
    data: { text, status: "DRAFT", approvedAt: null, scheduledAt: null, error: null },
  });
  revalidatePath(`/posts/${id}`);
  return { ok: true };
}

export async function approvePost(id: string) {
  const { post } = await getOwnPost(id);
  if (!canApprove(post.status) || !post.text.trim()) return;

  await db.post.update({
    where: { id, status: post.status },
    data: { status: "APPROVED", approvedAt: new Date(), error: null },
  });
  revalidatePath(`/posts/${id}`);
}

export async function unapprovePost(id: string) {
  const { post } = await getOwnPost(id);
  if (post.status !== "APPROVED" && post.status !== "SCHEDULED") return;

  await db.post.update({
    where: { id, status: post.status },
    data: { status: "DRAFT", approvedAt: null, scheduledAt: null },
  });
  revalidatePath(`/posts/${id}`);
}

export async function regeneratePost(id: string): Promise<FormState> {
  const { user, post } = await getOwnPost(id);
  if (!canEdit(post.status)) return { error: "Este post não pode mais ser editado." };

  let text;
  try {
    text = await generateDraft(post.briefing, user.voiceTone);
  } catch (error) {
    if (error instanceof DraftError) return { error: error.message };
    throw error;
  }

  await db.post.update({
    where: { id },
    data: { text, status: "DRAFT", approvedAt: null, scheduledAt: null, error: null },
  });
  revalidatePath(`/posts/${id}`);
  return { ok: true };
}

export async function deletePost(id: string) {
  const { post } = await getOwnPost(id);
  if (!canDelete(post.status)) return;

  await db.post.delete({ where: { id } });
  redirect("/");
}

export async function publishNow(id: string) {
  const { post } = await getOwnPost(id);
  if (!canPublish(post.status)) return;

  await publishPost(id, "APPROVED");
  revalidatePath(`/posts/${id}`);
}
