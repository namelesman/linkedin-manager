import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Roda só com um Postgres de teste: TEST_DATABASE_URL=postgres://... npm test
const url = process.env.TEST_DATABASE_URL;

vi.mock("server-only", () => ({}));

describe.skipIf(!url)("publisher (integração)", async () => {
  process.env.DATABASE_URL = url;
  process.env.TOKEN_ENC_KEY = randomBytes(32).toString("base64");

  const { db } = await import("./db");
  const { encrypt } = await import("./crypto");
  const { publishPost, releaseStuck, STUCK_AFTER_MS } = await import("./publisher");

  let userId: string;
  const postsCalls: unknown[] = [];

  function mockLinkedIn(handler: () => Promise<Response> | Response) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL) => {
        if (String(input).endsWith("/rest/posts")) {
          postsCalls.push(input);
          // Atraso para as duas chamadas concorrentes se sobreporem de verdade.
          await new Promise((r) => setTimeout(r, 50));
          return handler();
        }
        throw new Error(`fetch inesperado: ${input}`);
      }),
    );
  }

  beforeAll(async () => {
    await db.user.deleteMany({ where: { email: "teste@example.com" } });
    const user = await db.user.create({ data: { email: "teste@example.com", linkedinSub: "abc123" } });
    userId = user.id;
  });

  beforeEach(async () => {
    postsCalls.length = 0;
    await db.post.deleteMany({ where: { userId } });
    await db.linkedInAccount.upsert({
      where: { userId },
      create: { userId, accessToken: encrypt("tok"), expiresAt: new Date(Date.now() + 86_400_000), scope: "w_member_social" },
      update: { accessToken: encrypt("tok"), expiresAt: new Date(Date.now() + 86_400_000) },
    });
  });

  afterAll(async () => {
    vi.unstubAllGlobals();
    await db.user.deleteMany({ where: { id: userId } });
    await db.$disconnect();
  });

  it("duas publicações simultâneas resultam em um único post", async () => {
    mockLinkedIn(() => new Response(null, { status: 201, headers: { "x-restli-id": "urn:li:share:1" } }));
    const post = await db.post.create({ data: { userId, text: "Olá #teste", status: "APPROVED", approvedAt: new Date() } });

    const results = await Promise.all([publishPost(post.id, "APPROVED"), publishPost(post.id, "APPROVED")]);

    expect(results.sort()).toEqual(["published", "skipped"]);
    expect(postsCalls).toHaveLength(1);
    const saved = await db.post.findUniqueOrThrow({ where: { id: post.id } });
    expect(saved.status).toBe("PUBLISHED");
    expect(saved.linkedinUrl).toBe("https://www.linkedin.com/feed/update/urn:li:share:1/");

    // Publicado não volta a sair, nem de novo pelo mesmo caminho.
    expect(await publishPost(post.id, "APPROVED")).toBe("skipped");
    expect(postsCalls).toHaveLength(1);
  });

  it("não publica agendado antes da hora", async () => {
    mockLinkedIn(() => new Response(null, { status: 201, headers: { "x-restli-id": "urn:li:share:2" } }));
    const post = await db.post.create({
      data: { userId, text: "futuro", status: "SCHEDULED", scheduledAt: new Date(Date.now() + 3_600_000) },
    });

    expect(await publishPost(post.id, "SCHEDULED")).toBe("skipped");
    expect(postsCalls).toHaveLength(0);
  });

  it("resultado incerto vira ERROR e não é repetido", async () => {
    mockLinkedIn(() => new Response("boom", { status: 503 }));
    const post = await db.post.create({ data: { userId, text: "x", status: "APPROVED" } });

    expect(await publishPost(post.id, "APPROVED")).toBe("error");
    const saved = await db.post.findUniqueOrThrow({ where: { id: post.id } });
    expect(saved.status).toBe("ERROR");
    expect(saved.error).toMatch(/Resultado incerto/);
    expect(await publishPost(post.id, "APPROVED")).toBe("skipped");
    expect(postsCalls).toHaveLength(1);
  });

  it("token expirado não chama o LinkedIn", async () => {
    mockLinkedIn(() => new Response(null, { status: 201, headers: { "x-restli-id": "urn:li:share:3" } }));
    await db.linkedInAccount.update({ where: { userId }, data: { expiresAt: new Date(Date.now() - 1000) } });
    const post = await db.post.create({ data: { userId, text: "x", status: "APPROVED" } });

    expect(await publishPost(post.id, "APPROVED")).toBe("error");
    expect(postsCalls).toHaveLength(0);
    expect((await db.post.findUniqueOrThrow({ where: { id: post.id } })).error).toMatch(/expirado/);
  });

  it("post preso em PUBLISHING vira ERROR, sem republicar", async () => {
    const old = new Date(Date.now() - STUCK_AFTER_MS - 1000);
    const post = await db.post.create({ data: { userId, text: "x", status: "PUBLISHING", claimedAt: old } });

    expect(await releaseStuck()).toBeGreaterThanOrEqual(1);
    const saved = await db.post.findUniqueOrThrow({ where: { id: post.id } });
    expect(saved.status).toBe("ERROR");
    expect(saved.error).toMatch(/interrompida/);
  });
});
