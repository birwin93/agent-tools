import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { buildApp, type AppOptions } from "../src/index";
import * as schema from "../src/db/schema";
import { DocsService } from "../src/services/docs-service";
import type { DocImporter } from "../src/services/doc-importer";

type ClosableApp = ReturnType<typeof buildApp> & {
  close?: () => Promise<void>;
};

export async function createTestContext(options: Partial<AppOptions> = {}) {
  const client = new PGlite();

  const db = drizzle(client, { schema }) as unknown as PostgresJsDatabase<typeof schema>;
  const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "drizzle");
  await migrate(db, { migrationsFolder });

  const docService = options.docService ?? new DocsService(db);
  const docImporter: DocImporter =
    options.docImporter ??
    ({
      importDoc(input) {
        return Promise.resolve({ title: input.name, summary: "summary", content: "content" });
      },
    } satisfies DocImporter);
  const app = buildApp({ docService, docImporter }) as ClosableApp;

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
