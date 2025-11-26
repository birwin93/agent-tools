import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

export function createDb(databaseUrl: string): Database {
  const client = postgres(databaseUrl, { prepare: false });
  return drizzle(client, { schema });
}

export * from "./schema";
