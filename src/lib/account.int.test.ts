import { describe, expect, it } from "vitest";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("exclusão de conta (integração)", async () => {
  process.env.DATABASE_URL = url;
  const { db } = await import("./db");

  it("apagar o usuário remove token, sessões, posts, imagens e registros de acesso", async () => {
    await db.user.deleteMany({ where: { email: "apagar@example.com" } });
    const user = await db.user.create({
      data: {
        email: "apagar@example.com",
        linkedinSub: "del-sub",
        linkedinAccount: { create: { accessToken: "x", expiresAt: new Date(), scope: "s" } },
        sessions: { create: { id: "del-session", expiresAt: new Date() } },
        accessLogs: { create: { ip: "127.0.0.1" } },
        posts: { create: { text: "t", images: { create: { position: 0, mimeType: "image/png", data: new Uint8Array([1]) } } } },
      },
    });

    await db.user.delete({ where: { id: user.id } });

    const where = { userId: user.id };
    expect(await db.linkedInAccount.count({ where })).toBe(0);
    expect(await db.session.count({ where })).toBe(0);
    expect(await db.accessLog.count({ where })).toBe(0);
    expect(await db.post.count({ where })).toBe(0);
    expect(await db.postImage.count({ where: { post: { userId: user.id } } })).toBe(0);
    await db.$disconnect();
  });
});
