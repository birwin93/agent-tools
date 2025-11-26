import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { buildApp } from "../src/index";
import * as schema from "../src/db/schema";

type ClosableApp = ReturnType<typeof buildApp> & {
  close?: () => Promise<void>;
};

export async function createTestContext() {
  const client = new PGlite();
  await client.query(`
    CREATE TABLE docs (
      id uuid PRIMARY KEY,
      slug text NOT NULL UNIQUE,
      current_version_id uuid,
      title text NOT NULL,
      summary text NOT NULL,
      created_at timestamptz DEFAULT now() NOT NULL,
      updated_at timestamptz DEFAULT now() NOT NULL
    );
  `);
  await client.query(`CREATE INDEX docs_updated_at_idx ON docs(updated_at);`);
  await client.query(`
    CREATE TABLE doc_versions (
      id uuid PRIMARY KEY,
      doc_id uuid NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
      version integer NOT NULL,
      title text NOT NULL,
      summary text NOT NULL,
      content text NOT NULL,
      created_at timestamptz DEFAULT now() NOT NULL,
      UNIQUE(doc_id, version)
    );
  `);

  const db = drizzle(client, { schema }) as unknown as PostgresJsDatabase<typeof schema>;
  const app = buildApp(db) as ClosableApp;

  return {
    db,
    app,
    client,
    async close() {
      if (typeof app.close === "function") {
        await app.close();
      }
      await client.close();
    },
  };
}
