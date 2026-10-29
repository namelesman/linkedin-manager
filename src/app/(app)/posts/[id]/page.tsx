import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { approvePost, deletePost, publishNow, unapprovePost, unschedulePost } from "@/app/actions/posts";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { canApprove, canDelete, canEdit, canPublish, canSchedule } from "@/lib/post-status";
import { toLocalInputValue } from "@/lib/schedule";
import { PostEditor } from "./post-editor";
import { ImageManager } from "./image-manager";
import { ScheduleForm } from "./schedule-form";

// Regenerar chama a Claude API e publicar envia imagens ao LinkedIn.
export const maxDuration = 60;

const button =
  "rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900";

export default async function PostPage({ params }: PageProps<"/posts/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const post = await db.post.findFirst({
    where: { id, userId: user.id },
    include: { images: { orderBy: { position: "asc" }, select: { id: true, altText: true } } },
  });
  if (!post) notFound();
  // Sem carregar os bytes: só precisamos saber se ainda existem para o preview.
  const withData = new Set(
    (await db.postImage.findMany({ where: { postId: post.id, NOT: { data: null } }, select: { id: true } })).map((i) => i.id),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Post</h1>
        <StatusBadge status={post.status} />
        {post.approvedAt && <span className="text-xs text-neutral-500">aprovado em {formatDateTime(post.approvedAt)}</span>}
      </div>

      {post.error && (
        <p role="alert" className="rounded bg-red-100 px-3 py-2 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
          {post.error}
        </p>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer text-neutral-500">Briefing</summary>
        <p className="mt-2 whitespace-pre-wrap">{post.briefing}</p>
      </details>

      <PostEditor key={post.updatedAt.toISOString()} id={post.id} text={post.text} editable={canEdit(post.status)} />

      <ImageManager
        postId={post.id}
        editable={canEdit(post.status)}
        images={post.images.map((i) => ({ id: i.id, altText: i.altText, hasData: withData.has(i.id) }))}
      />

      {post.linkedinUrl && (
        <a href={post.linkedinUrl} target="_blank" rel="noreferrer" className="text-sm text-[#0a66c2] underline">
          Ver no LinkedIn
        </a>
      )}

      {post.status === "SCHEDULED" && post.scheduledAt && (
        <div className="flex flex-wrap items-center gap-3 rounded bg-violet-50 px-3 py-2 text-sm dark:bg-violet-950">
          Agendado para {formatDateTime(post.scheduledAt)} (Brasília).
          <form action={unschedulePost.bind(null, post.id)}>
            <button type="submit" className="underline">Cancelar agendamento</button>
          </form>
        </div>
      )}

      {canSchedule(post.status) && (
        <ScheduleForm id={post.id} initial={post.scheduledAt ? toLocalInputValue(post.scheduledAt) : undefined} />
      )}

      <div className="flex flex-wrap gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        {canApprove(post.status) && (
          <form action={approvePost.bind(null, post.id)}>
            <button type="submit" className={button}>Aprovar</button>
          </form>
        )}
        {canPublish(post.status) && (
          <form action={publishNow.bind(null, post.id)}>
            <button type="submit" className="rounded bg-[#0a66c2] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#004182]">
              Publicar agora
            </button>
          </form>
        )}
        {(post.status === "APPROVED" || post.status === "SCHEDULED") && (
          <form action={unapprovePost.bind(null, post.id)}>
            <button type="submit" className={button}>Voltar para rascunho</button>
          </form>
        )}
        {canDelete(post.status) && (
          <form action={deletePost.bind(null, post.id)} className="ml-auto">
            <button type="submit" className={`${button} text-red-700 dark:text-red-400`}>Excluir</button>
          </form>
        )}
      </div>
    </div>
  );
}
