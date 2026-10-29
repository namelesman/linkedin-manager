export const TOKEN_WARNING_DAYS = 7;

export function daysUntil(date: Date, now = new Date()): number {
  return Math.floor((date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

export function tokenStatus(expiresAt: Date | null | undefined, now = new Date()) {
  if (!expiresAt) return { state: "missing" as const, days: 0 };
  const days = daysUntil(expiresAt, now);
  if (expiresAt <= now) return { state: "expired" as const, days };
  if (days < TOKEN_WARNING_DAYS) return { state: "expiring" as const, days };
  return { state: "ok" as const, days };
}
