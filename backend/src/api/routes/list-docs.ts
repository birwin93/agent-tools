import { createRoute } from "./route-builder";
import { DocFrontmatterSchema } from "./shared-schemas";

export const listDocsRoute = createRoute({
  method: "get",
  path: "/docs",
  schemas: {
    responses: {
      200: DocFrontmatterSchema.array(),
    },
  },
  handler: async ({ service, c }) => {
    const docs = await service.listDocs();
    return c.json(docs);
  },
});
