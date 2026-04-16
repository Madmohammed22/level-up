// Prisma singleton (Prisma 7 with pg driver adapter).
// Avoids multiple instances during Next.js hot reload.

// Force IPv4 DNS resolution. Node 18+ may prefer AAAA (IPv6) records,
// but the Supabase pooler only reliably answers on IPv4 -> ECONNREFUSED otherwise.
// Must run BEFORE any module that opens a socket (pg, prisma adapter, etc.).
import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first");

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? buildClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
