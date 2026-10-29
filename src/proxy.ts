import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/cookies";

// Checagem otimista: só confere se o cookie existe. A validação real é feita em requireUser().
export default function proxy(req: NextRequest) {
  if (!req.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|privacidade|api/auth|api/cron|_next/static|_next/image|favicon.ico).*)"],
};
