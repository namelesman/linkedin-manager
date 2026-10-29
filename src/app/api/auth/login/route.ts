import { NextResponse } from "next/server";
import { authorizationUrl } from "@/lib/linkedin-auth";
import { randomToken } from "@/lib/crypto";
import { STATE_COOKIE } from "@/lib/cookies";

export async function GET() {
  const state = randomToken(16);
  const res = NextResponse.redirect(authorizationUrl(state));
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 10 * 60,
  });
  return res;
}
