import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { approvePost, deletePost, unapprovePost } from "@/app/actions/posts";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { canApprove, canDelete, canEdit } from "@/lib/post-status";
import { PostEditor } from "./post-editor";

// Regenerar o texto chama a Claude API.
export const maxDuration = 60;

const button =
  "rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900";

export default async function PostPage({ params }: PageProps<"/posts/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const post = await db.post.findFirst({ where: { id, userId: user.id } });
  if (!post) notFound();

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

      <div className="flex flex-wrap gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        {canApprove(post.status) && (
          <form action={approvePost.bind(null, post.id)}>
            <button type="submit" className={button}>Aprovar</button>
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
