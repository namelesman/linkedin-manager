import { timingSafeEqual } from "node:crypto";

// Brasília não tem horário de verão desde 2019: UTC-3 fixo.
const BRT_OFFSET = "-03:00";
export const MIN_LEAD_MS = 60 * 1000;

// Converte o valor de <input type="datetime-local"> (ex.: 2026-10-30T09:00) em horário de Brasília.
export function parseLocalDateTime(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00${BRT_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Inverso de parseLocalDateTime, para preencher o input.
export function toLocalInputValue(date: Date): string {
  return new Date(date.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

export function isValidCronAuth(header: string | null, secret = process.env.CRON_SECRET): boolean {
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}
