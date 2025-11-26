import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "bun";
import { parseEnv } from "./env";
import { createDb, type Database } from "./db";
import { DocsService } from "./services/docs-service";
import { registerRoutes } from "./api/routes";

const API_PREFIX = "/api/v1";

export function buildApp(db: Database) {
  const app = new Hono();
  const service = new DocsService(db);

  app.use("/*", cors());

  const api = app.basePath(API_PREFIX);
  registerRoutes(api, service);

  return app;
}

async function main() {
  const env = parseEnv();
  const db = createDb(env.DATABASE_URL);
  const app = buildApp(db);

  serve({
    fetch: app.fetch,
    port: env.PORT,
    hostname: "0.0.0.0",
  });

  // eslint-disable-next-line no-console
  console.log(`Server listening on ${env.PORT}`);
}

if (import.meta.main) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}
