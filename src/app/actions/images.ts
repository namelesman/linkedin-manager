"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { canEdit } from "@/lib/post-status";
import { MAX_IMAGES, MAX_IMAGE_BYTES, detectImageType } from "@/lib/images";
import type { FormState } from "./settings";

async function getEditablePost(postId: string) {
  const user = await requireUser();
  const post = await db.post.findFirst({ where: { id: postId, userId: user.id }, include: { _count: { select: { images: true } } } });
  if (!post) redirect("/");
  return post;
}

// Mudar as imagens muda o conteúdo: o post precisa de nova aprovação.
const backToDraft = { status: "DRAFT" as const, approvedAt: null, scheduledAt: null, error: null };

export async function addImage(postId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const post = await getEditablePost(postId);
  if (!canEdit(post.status)) return { error: "Este post não pode mais ser editado." };
  if (post._count.images >= MAX_IMAGES) return { error: `O LinkedIn aceita até ${MAX_IMAGES} imagens.` };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "Escolha uma imagem." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "A imagem passa de 4 MB." };

  const data = new Uint8Array(await file.arrayBuffer());
  const mimeType = detectImageType(data);
  if (!mimeType) return { error: "Use JPG, PNG ou GIF." };

  const altText = String(formData.get("altText") ?? "").trim().slice(0, 300);
  await db.$transaction([
    db.postImage.create({ data: { postId, position: post._count.images, mimeType, altText, data } }),
    db.post.update({ where: { id: postId }, data: backToDraft }),
  ]);
  revalidatePath(`/posts/${postId}`);
  return { ok: true };
}

export async function removeImage(postId: string, imageId: string) {
  const post = await getEditablePost(postId);
  if (!canEdit(post.status)) return;

  await db.$transaction([
    db.postImage.deleteMany({ where: { id: imageId, postId } }),
    db.post.update({ where: { id: postId }, data: backToDraft }),
  ]);
  revalidatePath(`/posts/${postId}`);
}
