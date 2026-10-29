import "server-only";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { toCommentary } from "@/lib/little-text";
import { LinkedInError, createPost, personUrn, postUrl, uploadImage } from "@/lib/linkedin";
import type { PostStatus } from "@/generated/prisma/enums";

export const STUCK_AFTER_MS = 10 * 60 * 1000;
// Sem GET em /rest/images (w_member_social é só escrita), damos um tempo para o processamento.
const IMAGE_SETTLE_MS = 4000;

export type PublishResult = "published" | "skipped" | "error";

/**
 * Tira o post de `from` para PUBLISHING num único UPDATE condicional.
 * Só uma chamada concorrente consegue (count = 1); as outras recebem false.
 */
export async function claim(postId: string, from: PostStatus, now = new Date()): Promise<boolean> {
  const { count } = await db.post.updateMany({
    where: {
      id: postId,
      status: from,
      ...(from === "SCHEDULED" ? { scheduledAt: { lte: now } } : {}),
    },
    data: { status: "PUBLISHING", claimedAt: now, attempts: { increment: 1 }, error: null },
  });
  return count === 1;
}

async function fail(postId: string, error: string) {
  await db.post.update({ where: { id: postId }, data: { status: "ERROR", error } });
}

export async function publishPost(postId: string, from: "APPROVED" | "SCHEDULED"): Promise<PublishResult> {
  if (!(await claim(postId, from))) return "skipped";

  const post = await db.post.findUniqueOrThrow({
    where: { id: postId },
    include: {
      images: { orderBy: { position: "asc" } },
      user: { include: { linkedinAccount: true } },
    },
  });

  const account = post.user.linkedinAccount;
  if (!account || account.expiresAt <= new Date()) {
    await fail(postId, "Token do LinkedIn expirado. Entre de novo e aprove o post outra vez.");
    return "error";
  }
  const token = decrypt(account.accessToken);
  const author = personUrn(post.user.linkedinSub);

  // Até aqui nada foi publicado: qualquer falha volta como ERROR seguro para tentar de novo.
  try {
    let uploaded = false;
    for (const image of post.images) {
      if (image.imageUrn) continue;
      if (!image.data) throw new LinkedInError("Imagem sem conteúdo salvo");
      const urn = await uploadImage(token, author, image.data, image.mimeType);
      await db.postImage.update({ where: { id: image.id }, data: { imageUrn: urn } });
      image.imageUrn = urn;
      uploaded = true;
    }
    if (uploaded) await new Promise((r) => setTimeout(r, IMAGE_SETTLE_MS));
  } catch (error) {
    await fail(postId, `Falha no upload de imagem: ${(error as Error).message}`);
    return "error";
  }

  let urn: string;
  try {
    urn = await createPost(
      token,
      author,
      toCommentary(post.text),
      post.images.map((i) => ({ urn: i.imageUrn!, altText: i.altText })),
    );
  } catch (error) {
    const ambiguous = error instanceof LinkedInError && error.ambiguous;
    await fail(
      postId,
      ambiguous
        ? `Resultado incerto (${(error as Error).message}). Confira no seu perfil do LinkedIn antes de publicar de novo.`
        : (error as Error).message,
    );
    return "error";
  }

  await db.$transaction([
    db.post.update({
      where: { id: postId },
      data: { status: "PUBLISHED", publishedAt: new Date(), linkedinUrn: urn, linkedinUrl: postUrl(urn), error: null },
    }),
    // Depois de publicado não guardamos mais os bytes das imagens, só o URN.
    db.postImage.updateMany({ where: { postId }, data: { data: null } }),
  ]);
  return "published";
}

// Post que ficou em PUBLISHING (função caiu no meio) nunca é republicado automaticamente.
export async function releaseStuck(now = new Date()): Promise<number> {
  const { count } = await db.post.updateMany({
    where: { status: "PUBLISHING", claimedAt: { lt: new Date(now.getTime() - STUCK_AFTER_MS) } },
    data: {
      status: "ERROR",
      error: "A publicação foi interrompida. Confira no seu perfil do LinkedIn se o post saiu antes de tentar de novo.",
    },
  });
  return count;
}
