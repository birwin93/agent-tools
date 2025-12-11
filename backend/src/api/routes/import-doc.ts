import { z } from "zod";
import { slugify } from "../../utils/slugify";
import { createRoute } from "./route-builder";
import { ApiErrorSchema, DocWithContentSchema } from "./shared-schemas";

const ImportDocBodySchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
});

export const importDocRoute = createRoute({
  method: "post",
  path: "/docs/import",
  schemas: {
    body: ImportDocBodySchema,
    responses: {
      201: DocWithContentSchema,
      400: ApiErrorSchema,
      500: ApiErrorSchema,
    },
  },
  handler: async ({ body, docImporter, service, c }) => {
    if (!body) {
      return c.json(
        { error: "validation_error", message: "Request body is required" } satisfies typeof ApiErrorSchema._type,
        400,
      );
    }

    try {
      console.log("[docs/import] starting", { name: body.name, url: body.url });
      const imported = await docImporter.importDoc({ name: body.name, url: body.url });
      console.log("[docs/import] importer response", {
        title: imported.title,
        hasSummary: Boolean(imported.summary),
        contentLength: imported.content.length,
      });
      const created = await service.createDoc({
        slug: slugify(body.name),
        title: imported.title ?? body.name,
        summary: imported.summary ?? imported.content.slice(0, 200),
        content: imported.content,
      });
      console.log("[docs/import] created doc", { id: created.id, slug: created.slug });
      return c.json(created, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[docs/import] failed", err);
      return c.json({ error: "import_failed", message } satisfies typeof ApiErrorSchema._type, 500);
    }
  },
});
