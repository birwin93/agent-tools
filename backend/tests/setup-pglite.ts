import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { buildApp, type AppOptions } from "../src/index";
import * as schema from "../src/db/schema";
import { DocsService } from "../src/services/docs-service";
import type { DocImporter } from "../src/services/doc-importer";

type ClosableApp = ReturnType<typeof buildApp> & {
  close?: () => Promise<void>;
};

export async function createTestContext(options: Partial<AppOptions> = {}) {
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
  const docService = options.docService ?? new DocsService(db);
  const docImporter: DocImporter =
    options.docImporter ??
    ({
      importDoc(input) {
        return Promise.resolve({ title: input.name, summary: "summary", content: "content" });
      },
    } satisfies DocImporter);
  const app = buildApp(db, { docService, docImporter }) as ClosableApp;

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
