import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { createSession } from "@/lib/session";
import { exchangeCode, fetchUserInfo, isAllowedEmail } from "@/lib/linkedin-auth";
import { STATE_COOKIE } from "@/lib/cookies";

function fail(req: NextRequest, reason: string) {
  const res = NextResponse.redirect(new URL(`/login?erro=${reason}`, req.url));
  res.cookies.delete({ name: STATE_COOKIE, path: "/api/auth" });
  return res;
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const state = params.get("state");
  const code = params.get("code");

  if (params.get("error")) return fail(req, "cancelado");
  if (!code || !state || state !== req.cookies.get(STATE_COOKIE)?.value) return fail(req, "estado");

  let token, info;
  try {
    token = await exchangeCode(code);
    info = await fetchUserInfo(token.access_token);
  } catch {
    return fail(req, "linkedin");
  }

  if (!info.email_verified || !isAllowedEmail(info.email)) return fail(req, "nao-autorizado");

  const expiresAt = new Date(Date.now() + token.expires_in * 1000);
  const user = await db.user.upsert({
    where: { linkedinSub: info.sub },
    create: { linkedinSub: info.sub, email: info.email!, name: info.name },
    update: { email: info.email!, name: info.name },
  });
  const account = { accessToken: encrypt(token.access_token), expiresAt, scope: token.scope };
  await db.linkedInAccount.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...account },
    update: account,
  });

  // Registro de acesso (Marco Civil art. 15): só IP e data/hora.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconhecido";
  await db.accessLog.create({ data: { userId: user.id, ip } });

  await createSession(user.id);
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.delete({ name: STATE_COOKIE, path: "/api/auth" });
  return res;
}
