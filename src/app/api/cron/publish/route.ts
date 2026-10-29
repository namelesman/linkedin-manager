import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { publishPost, releaseStuck } from "@/lib/publisher";
import { isValidCronAuth } from "@/lib/schedule";

// Chamado pelo GitHub Actions a cada 5 minutos (.github/workflows/publish.yml).
export const maxDuration = 60;

// Poucos por execução para caber no tempo da função; o resto sai na próxima rodada.
const BATCH = 5;

export async function GET(req: NextRequest) {
  if (!isValidCronAuth(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const stuck = await releaseStuck();
  const due = await db.post.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
    orderBy: { scheduledAt: "asc" },
    take: BATCH,
    select: { id: true },
  });

  const results: Record<string, string> = {};
  // Em série: cada publicação faz o próprio claim, então uma execução sobreposta não duplica.
  for (const { id } of due) {
    results[id] = await publishPost(id, "SCHEDULED");
  }

  return NextResponse.json({ stuck, results });
}
