import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import { serve } from "bun";
import { parseEnv } from "./env";
import { createDb } from "./db";
import { DocsService } from "./services/docs-service";
import { createDefaultDocImporter, type DocImporter } from "./services/doc-importer";
import { registerRoutes } from "./api/routes";

const API_PREFIX = "/api/v1";
const LOG_NAMESPACE = "[backend]";

function debugLog(message: string, ...details: unknown[]) {
  console.debug(`${LOG_NAMESPACE} ${message}`, ...details);
}

const requestLogger: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  debugLog(`-> ${method} ${path}`);

  let caughtError: unknown;
  try {
    await next();
  } catch (err) {
    caughtError = err;
    throw err;
  } finally {
    const duration = Date.now() - start;
    const status = c.res?.status ?? (caughtError ? 500 : 0);

    if (caughtError) {
      debugLog(`xx ${method} ${path} status=${status} (${duration}ms)`, caughtError);
    } else {
      debugLog(`<- ${method} ${path} status=${status} (${duration}ms)`);
    }
  }
};

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
<<<<<<< HEAD
  registerRoutes(api, service, docImporter);
=======
  api.use("*", requestLogger);
  registerRoutes(api, service);
>>>>>>> 8b4eaf8 (add logging)

  return app;
}

function main() {
  debugLog("Parsing environment variables");
  const env = parseEnv();
  debugLog(`Environment ready (PORT=${env.PORT})`);

  debugLog("Creating database connection");
  const db = createDb(env.DATABASE_URL);
<<<<<<< HEAD
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
=======
  debugLog("Database connection created");

  debugLog("Building application");
  const app = buildApp(db);
>>>>>>> 8b4eaf8 (add logging)

  debugLog(`Starting server on http://0.0.0.0:${env.PORT}${API_PREFIX}`);
  const server = serve({
    fetch: app.fetch,
    port: env.PORT,
    hostname: "0.0.0.0",
  });

  debugLog(`Server listening on http://${server.hostname}:${server.port}`);

}

if (import.meta.main) {
  main();
}
