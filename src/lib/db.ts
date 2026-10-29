import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL!;
  // Neon em produção (driver serverless); Postgres comum em dev e nos testes.
  const adapter = new URL(connectionString).hostname.endsWith(".neon.tech")
    ? new PrismaNeon({ connectionString })
    : new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// Reaproveita o client entre hot reloads no dev.
export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
