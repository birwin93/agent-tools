import Fastify from "fastify";
import cors from "@fastify/cors";
import { parseEnv } from "./env";
import { createDb, type Database } from "./db";
import { DocsService, DocNotFoundError, SlugConflictError } from "./services/docs-service";
import {
  ApiErrorSchema,
  CreateDocRequestSchema,
  UpdateDocRequestSchema,
  DocWithContentSchema,
  DocFrontmatterSchema,
} from "./api/schemas";
import { routes } from "./api/routes";

const API_PREFIX = "/api/v1";

export function buildApp(db: Database) {
  const app = Fastify({ logger: true });
  app.register(cors, { origin: true });

  const service = new DocsService(db);

  app.get(`${API_PREFIX}${routes.health.path}`, async () => ({ status: "ok" }));

  app.get(`${API_PREFIX}${routes.listDocs.path}`, async (_request, reply) => {
    const docs = await service.listDocs();
    reply.status(200);
    return { docs } satisfies { docs: typeof DocFrontmatterSchema._type[] };
  });

  app.get(`${API_PREFIX}${routes.getDocById.path}`, async (request, reply) => {
    const { id } = request.params as { id: string };
    const doc = await service.getDocById(id);
    if (!doc) {
      reply.status(404);
      return { error: "not_found", message: "Doc not found" } satisfies typeof ApiErrorSchema._type;
    }
    return doc;
  });

  app.get(`${API_PREFIX}${routes.getDocBySlug.path}`, async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const doc = await service.getDocBySlug(slug);
    if (!doc) {
      reply.status(404);
      return { error: "not_found", message: "Doc not found" } satisfies typeof ApiErrorSchema._type;
    }
    return doc;
  });

  app.post(`${API_PREFIX}${routes.createDoc.path}`, async (request, reply) => {
    const parseResult = CreateDocRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      reply.status(400);
      return {
        error: "validation_error",
        message: parseResult.error.message,
      } satisfies typeof ApiErrorSchema._type;
    }

    try {
      const created = await service.createDoc(parseResult.data);
      reply.status(201);
      return created;
    } catch (err) {
      if (err instanceof SlugConflictError) {
        reply.status(409);
        return { error: "conflict", message: "Slug already exists" } satisfies typeof ApiErrorSchema._type;
      }
      throw err;
    }
  });

  app.put(`${API_PREFIX}${routes.updateDoc.path}`, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parseResult = UpdateDocRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      reply.status(400);
      return { error: "validation_error", message: parseResult.error.message } satisfies typeof ApiErrorSchema._type;
    }

    try {
      const updated = await service.updateDoc(id, parseResult.data);
      return updated satisfies typeof DocWithContentSchema._type;
    } catch (err) {
      if (err instanceof DocNotFoundError) {
        reply.status(404);
        return { error: "not_found", message: "Doc not found" } satisfies typeof ApiErrorSchema._type;
      }
      throw err;
    }
  });

  return app;
}

async function main() {
  const env = parseEnv();
  const db = createDb(env.DATABASE_URL);
  const app = buildApp(db);
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
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
