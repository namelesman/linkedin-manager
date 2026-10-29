import type { PostStatus } from "@/generated/prisma/enums";
import { STATUS_LABEL } from "@/lib/post-status";

const COLORS: Record<PostStatus, string> = {
  DRAFT: "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
  APPROVED: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100",
  SCHEDULED: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100",
  PUBLISHING: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  PUBLISHED: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-100",
  ERROR: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100",
};

export function StatusBadge({ status }: { status: PostStatus }) {
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${COLORS[status]}`}>{STATUS_LABEL[status]}</span>;
}
