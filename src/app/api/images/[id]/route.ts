import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// Preview das imagens ainda não publicadas; só o dono do post vê.
export async function GET(_req: Request, ctx: RouteContext<"/api/images/[id]">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Não autorizado", { status: 401 });

  const { id } = await ctx.params;
  const image = await db.postImage.findFirst({
    where: { id, post: { userId: user.id } },
    select: { data: true, mimeType: true },
  });
  if (!image?.data) return new Response("Não encontrada", { status: 404 });

  return new Response(Buffer.from(image.data), {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
