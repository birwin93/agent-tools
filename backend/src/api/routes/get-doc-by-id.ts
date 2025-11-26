import { z } from "zod";

import { createRoute } from "./route-builder";
import { ApiErrorSchema, DocWithContentSchema } from "./shared-schemas";

const GetDocParamsSchema = z.object({
  id: z.string().min(1),
});

export const getDocByIdRoute = createRoute({
  method: "get",
  path: "/docs/:id",
  schemas: {
    params: GetDocParamsSchema,
    responses: {
      200: DocWithContentSchema,
      404: ApiErrorSchema,
    },
  },
  handler: async ({ params, service, c }) => {
    const doc = await service.getDocById(params.id);
    if (!doc) {
      return c.json({ error: "not_found", message: "Doc not found" } satisfies typeof ApiErrorSchema._type, 404);
    }
    return c.json(doc);
  },
});
