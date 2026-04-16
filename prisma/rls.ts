/**
 * Enable Row-Level Security (RLS) on every table in the `public` schema.
 *
 * Why: Supabase exposes a public REST/GraphQL API at
 *   $NEXT_PUBLIC_SUPABASE_URL/rest/v1/<Table>
 * authenticated by the anon JWT (which is, by design, public and shipped to
 * the browser). Without RLS, anyone holding the anon key can read/write
 * every table.
 *
 * Our app never queries `public.*` via the supabase client — all data flows
 * through Prisma as the `postgres` role, which has `BYPASSRLS`. So a pure
 * deny-all RLS posture (no policies) is correct: the app keeps working, the
 * anon/authenticated roles get zero access.
 *
 * Idempotent. Run any time the schema changes:
 *   pnpm db:rls
 */
import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first");

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type TableRow = { tablename: string; rowsecurity: boolean };

async function main() {
  console.log("Enabling RLS on public schema tables…");

  const tables = await prisma.$queryRaw<TableRow[]>`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;

  if (tables.length === 0) {
    console.warn("No tables found in public schema — did you run db:push?");
    return;
  }

  let enabled = 0;
  let already = 0;

  for (const t of tables) {
    if (t.rowsecurity) {
      already += 1;
      console.log(`  ✓ ${t.tablename} (already enabled)`);
      continue;
    }
    // Quote the identifier; some Prisma implicit join tables start with "_".
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "${t.tablename}" ENABLE ROW LEVEL SECURITY`,
    );
    enabled += 1;
    console.log(`  + ${t.tablename} — enabled`);
  }

  console.log(
    `Done. ${enabled} newly enabled, ${already} already enabled, ${tables.length} total.`,
  );
  console.log(
    "\nNo policies added → anon/authenticated roles have zero access to public.*\n" +
      "App queries go through Prisma (postgres role, BYPASSRLS) and keep working.",
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
