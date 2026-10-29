import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL!;
  // Neon em produção (driver serverless); Postgres comum em dev e nos testes.
  const adapter = new URL(connectionString).hostname.endsWith(".neon.tech")
    ? new PrismaNeon({ connectionString })
    : // `prisma dev` aceita uma conexão por vez: use DATABASE_POOL_MAX=1 com ele.
      new PrismaPg({ connectionString, max: Number(process.env.DATABASE_POOL_MAX) || undefined });
  return new PrismaClient({ adapter });
}

// Reaproveita o client entre hot reloads no dev.
export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
