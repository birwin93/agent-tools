import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "bun";
import { parseEnv } from "./env";
import { createDb } from "./db";
import { DocsService } from "./services/docs-service";
import { createDefaultDocImporter, type DocImporter } from "./services/doc-importer";
import { registerRoutes } from "./api/routes";

const API_PREFIX = "/api/v1";

export type AppOptions = {
  docService: DocsService;
  docImporter: DocImporter;
};

export function buildApp(options: AppOptions) {
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
  const docImporter = createDefaultDocImporter({
    apiKey: env.OPENROUTER_API_KEY,
    ...(env.OPENROUTER_MODEL ? { model: env.OPENROUTER_MODEL } : {}),
    ...(env.OPENROUTER_HTTP_REFERER ? { referer: env.OPENROUTER_HTTP_REFERER } : {}),
    ...(env.OPENROUTER_TITLE ? { title: env.OPENROUTER_TITLE } : {}),
  });

  const app = buildApp({
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
  main();
}
