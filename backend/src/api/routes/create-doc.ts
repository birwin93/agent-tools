import { z } from "zod";

import { SlugConflictError, type CreateDocInput } from "../../services/docs-service";
import { createRoute } from "./route-builder";
import { ApiErrorSchema, DocWithContentSchema } from "./shared-schemas";

const CreateDocBodySchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1),
  summary: z.string().min(1),
  content: z.string().min(1),
});

export const createDocRoute = createRoute({
  method: "post",
  path: "/docs",
  schemas: {
    body: CreateDocBodySchema,
    responses: {
      201: DocWithContentSchema,
      409: ApiErrorSchema,
    },
  },
  handler: async ({ body, service, c }) => {
    if (!body) {
      return c.json({ error: "validation_error", message: "Request body is required" } satisfies typeof ApiErrorSchema._type, 400);
    }

    try {
      const payload: CreateDocInput = {
        ...(body.slug ? { slug: body.slug } : {}),
        title: body.title,
        summary: body.summary,
        content: body.content,
      };

      const created = await service.createDoc(payload);
      return c.json(created, 201);
    } catch (err) {
      if (err instanceof SlugConflictError) {
        return c.json({ error: "conflict", message: "Slug already exists" } satisfies typeof ApiErrorSchema._type, 409);
      }
      throw err;
    }
  },
});
