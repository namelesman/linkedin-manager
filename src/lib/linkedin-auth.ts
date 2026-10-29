import "server-only";

export const LINKEDIN_SCOPES = ["openid", "profile", "email", "w_member_social"];

export type LinkedInTokenResponse = {
  access_token: string;
  expires_in: number;
  scope: string;
};

export type LinkedInUserInfo = {
  sub: string;
  name?: string;
  email?: string;
  email_verified?: boolean;
};

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} não configurada`);
  return value;
}

export function redirectUri(): string {
  return `${env("APP_URL")}/api/auth/callback`;
}

export function authorizationUrl(state: string): string {
  const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: env("AUTH_LINKEDIN_ID"),
    redirect_uri: redirectUri(),
    state,
    scope: LINKEDIN_SCOPES.join(" "),
  }).toString();
  return url.toString();
}

export async function exchangeCode(code: string): Promise<LinkedInTokenResponse> {
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
      client_id: env("AUTH_LINKEDIN_ID"),
      client_secret: env("AUTH_LINKEDIN_SECRET"),
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Falha ao trocar o code (${res.status})`);
  return res.json();
}

export async function fetchUserInfo(accessToken: string): Promise<LinkedInUserInfo> {
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Falha ao ler o perfil (${res.status})`);
  return res.json();
}

export function isAllowedEmail(email: string | undefined, allowed = process.env.ALLOWED_EMAIL): boolean {
  if (!email || !allowed) return false;
  return email.trim().toLowerCase() === allowed.trim().toLowerCase();
}
