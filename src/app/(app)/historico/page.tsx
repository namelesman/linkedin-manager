import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { StatusBadge } from "@/components/status-badge";
import { excerpt, formatDateTime } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/post-status";
import { PostStatus } from "@/generated/prisma/enums";

const PAGE_SIZE = 50;
const STATUSES = Object.values(PostStatus);

export default async function HistoryPage({ searchParams }: PageProps<"/historico">) {
  const user = await requireUser();
  const { status: raw, page: rawPage } = await searchParams;
  const status = STATUSES.find((s) => s === raw);
  const page = Math.max(1, Number(rawPage) || 1);

  const where = { userId: user.id, ...(status ? { status } : {}) };
  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, text: true, briefing: true, status: true, scheduledAt: true, publishedAt: true, updatedAt: true, linkedinUrl: true },
    }),
    db.post.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (s?: string, p = 1) => `/historico?${new URLSearchParams({ ...(s ? { status: s } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Histórico</h1>

      <nav aria-label="Filtrar por status" className="flex flex-wrap gap-2 text-sm">
        {[undefined, ...STATUSES].map((s) => (
          <Link
            key={s ?? "todos"}
            href={href(s)}
            aria-current={s === status ? "page" : undefined}
            className={`rounded px-2 py-1 ${s === status ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "hover:underline"}`}
          >
            {s ? STATUS_LABEL[s] : "Todos"}
          </Link>
        ))}
      </nav>

      {posts.length === 0 ? (
        <p className="text-neutral-500">Nenhum post encontrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-neutral-500">
              <tr>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Post</th>
                <th className="py-2 pr-3 font-medium">Data</th>
                <th className="py-2 font-medium">LinkedIn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {posts.map((post) => {
                const date = post.publishedAt ?? post.scheduledAt ?? post.updatedAt;
                return (
                  <tr key={post.id}>
                    <td className="py-2 pr-3 align-top"><StatusBadge status={post.status} /></td>
                    <td className="py-2 pr-3 align-top">
                      <Link href={`/posts/${post.id}`} className="hover:underline">{excerpt(post.text || post.briefing, 100)}</Link>
                    </td>
                    <td className="whitespace-nowrap py-2 pr-3 align-top text-neutral-500">{formatDateTime(date)}</td>
                    <td className="py-2 align-top">
                      {post.linkedinUrl ? (
                        <a href={post.linkedinUrl} target="_blank" rel="noreferrer" className="text-[#0a66c2] underline">Abrir</a>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Páginas" className="flex items-center gap-3 text-sm">
          {page > 1 && <Link href={href(status, page - 1)} className="underline">Anterior</Link>}
          <span className="text-neutral-500">Página {page} de {pages}</span>
          {page < pages && <Link href={href(status, page + 1)} className="underline">Próxima</Link>}
        </nav>
      )}
    </div>
  );
}
