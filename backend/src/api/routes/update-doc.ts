import { z } from "zod";

import { DocNotFoundError } from "../../services/docs-service";
import { createRoute } from "./route-builder";
import { ApiErrorSchema, DocWithContentSchema } from "./shared-schemas";

const UpdateDocParamsSchema = z.object({
  id: z.string().min(1),
});

const UpdateDocBodySchema = z.object({
  title: z.string().min(1).optional(),
  summary: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
});

export const updateDocRoute = createRoute({
  method: "put",
  path: "/docs/:id",
  schemas: {
    params: UpdateDocParamsSchema,
    body: UpdateDocBodySchema,
    responses: {
      200: DocWithContentSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
    },
  },
  handler: async ({ params, body, service, c }) => {
    if (!body || Object.keys(body).length === 0) {
      return c.json({ error: "validation_error", message: "At least one field must be provided" } satisfies typeof ApiErrorSchema._type, 400);
    }

    try {
      const updated = await service.updateDoc(params!.id, body!);
      return c.json(updated);
    } catch (err) {
      if (err instanceof DocNotFoundError) {
        return c.json({ error: "not_found", message: "Doc not found" } satisfies typeof ApiErrorSchema._type, 404);
      }
      throw err;
    }
  },
});
