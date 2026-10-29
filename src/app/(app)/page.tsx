import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { StatusBadge } from "@/components/status-badge";
import { excerpt, formatDateTime } from "@/lib/format";
import type { PostStatus } from "@/generated/prisma/enums";

const SECTIONS: { title: string; statuses: PostStatus[] }[] = [
  { title: "Precisam de atenção", statuses: ["ERROR", "PUBLISHING"] },
  { title: "Rascunhos", statuses: ["DRAFT"] },
  { title: "Aprovados", statuses: ["APPROVED"] },
  { title: "Agendados", statuses: ["SCHEDULED"] },
];

export default async function QueuePage() {
  const user = await requireUser();
  const posts = await db.post.findMany({
    where: { userId: user.id, status: { not: "PUBLISHED" } },
    orderBy: [{ scheduledAt: "asc" }, { updatedAt: "desc" }],
    select: { id: true, text: true, briefing: true, status: true, scheduledAt: true, updatedAt: true },
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Fila</h1>
        <Link href="/posts/new" className="rounded bg-[#0a66c2] px-4 py-2 text-sm font-medium text-white hover:bg-[#004182]">
          Novo post
        </Link>
      </div>

      {posts.length === 0 && <p className="text-neutral-500">Nenhum post na fila. Crie um rascunho para começar.</p>}

      {SECTIONS.map(({ title, statuses }) => {
        const items = posts.filter((p) => statuses.includes(p.status));
        if (items.length === 0) return null;
        return (
          <section key={title} className="flex flex-col gap-2">
            <h2 className="text-lg font-medium">{title}</h2>
            <ul className="divide-y divide-neutral-200 rounded border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
              {items.map((post) => (
                <li key={post.id}>
                  <Link href={`/posts/${post.id}`} className="flex flex-col gap-1 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-900">
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <StatusBadge status={post.status} />
                      {post.scheduledAt ? `para ${formatDateTime(post.scheduledAt)}` : `editado ${formatDateTime(post.updatedAt)}`}
                    </div>
                    <p className="text-sm">{excerpt(post.text || post.briefing)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
