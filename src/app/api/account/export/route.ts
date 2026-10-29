import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// Acesso e portabilidade (LGPD art. 18, II e V): tudo o que guardamos, menos segredos e bytes de imagem.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Não autorizado", { status: 401 });

  const data = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      email: true,
      name: true,
      linkedinSub: true,
      voiceTone: true,
      createdAt: true,
      linkedinAccount: { select: { expiresAt: true, scope: true } },
      posts: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          briefing: true,
          text: true,
          status: true,
          scheduledAt: true,
          approvedAt: true,
          publishedAt: true,
          linkedinUrn: true,
          linkedinUrl: true,
          error: true,
          createdAt: true,
          images: { select: { position: true, mimeType: true, altText: true, imageUrn: true } },
        },
      },
      accessLogs: { orderBy: { at: "asc" }, select: { ip: true, at: true } },
    },
  });

  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="linkedin-manager-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
