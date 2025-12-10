import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "bun";
import { parseEnv } from "./env";
import { createDb, type Database } from "./db";
import { DocsService } from "./services/docs-service";
import { createDefaultDocImporter, type DocImporter } from "./services/doc-importer";
import { registerRoutes } from "./api/routes";

const API_PREFIX = "/api/v1";

export type AppOptions = {
  docService: DocsService;
  docImporter: DocImporter;
};

export function buildApp(db: Database, options: AppOptions) {
  const app = new Hono();
  const service = options.docService;
  const docImporter = options.docImporter;

  app.use("/*", cors());

  const api = app.basePath(API_PREFIX);
  registerRoutes(api, service, docImporter);

  return app;
}

function main() {
  const env = parseEnv();
  const db = createDb(env.DATABASE_URL);
  const docService = new DocsService(db);
  if (!env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is required to start the server (doc importer)");
  }
  const docImporter = createDefaultDocImporter({
    apiKey: env.OPENROUTER_API_KEY,
    model: env.OPENROUTER_MODEL,
    referer: env.OPENROUTER_HTTP_REFERER,
    title: env.OPENROUTER_TITLE,
  });

  const app = buildApp(db, {
    docService,
    docImporter,
  });

  serve({
    fetch: app.fetch,
    port: env.PORT,
    hostname: "0.0.0.0",
  });

}

if (import.meta.main) {
  try {
    main();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
