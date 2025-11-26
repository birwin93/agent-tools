import { z } from "zod";

import { createRoute } from "./route-builder";
import { ApiErrorSchema, DocWithContentSchema } from "./shared-schemas";

const GetDocBySlugParamsSchema = z.object({
  slug: z.string().min(1),
});

export const getDocBySlugRoute = createRoute({
  method: "get",
  path: "/docs/by-slug/:slug",
  schemas: {
    params: GetDocBySlugParamsSchema,
    responses: {
      200: DocWithContentSchema,
      404: ApiErrorSchema,
    },
  },
  handler: async ({ params, service, c }) => {
    const doc = await service.getDocBySlug(params.slug);
    if (!doc) {
      return c.json({ error: "not_found", message: "Doc not found" } satisfies typeof ApiErrorSchema._type, 404);
    }
    return c.json(doc);
  },
});
