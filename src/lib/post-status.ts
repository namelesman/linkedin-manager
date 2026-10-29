import type { PostStatus } from "@/generated/prisma/enums";

export const STATUS_LABEL: Record<PostStatus, string> = {
  DRAFT: "Rascunho",
  APPROVED: "Aprovado",
  SCHEDULED: "Agendado",
  PUBLISHING: "Publicando",
  PUBLISHED: "Publicado",
  ERROR: "Erro",
};

// Em PUBLISHING o post pode já ter saído no LinkedIn; em PUBLISHED já saiu. Nenhum dos dois é editável.
export function canEdit(status: PostStatus): boolean {
  return status === "DRAFT" || status === "APPROVED" || status === "SCHEDULED" || status === "ERROR";
}

export function canApprove(status: PostStatus): boolean {
  return status === "DRAFT" || status === "ERROR";
}

// Só o que foi aprovado manualmente pode ir para o LinkedIn.
export function canPublish(status: PostStatus): boolean {
  return status === "APPROVED";
}

export function canSchedule(status: PostStatus): boolean {
  return status === "APPROVED" || status === "SCHEDULED";
}

export function canDelete(status: PostStatus): boolean {
  return status !== "PUBLISHING";
}
