import { z } from "zod";

import { createRoute } from "./route-builder";

const HealthResponseSchema = z.object({ status: z.literal("ok") });

export const healthRoute = createRoute({
  method: "get",
  path: "/health",
  schemas: {
    responses: {
      200: HealthResponseSchema,
    },
  },
  handler: ({ c }) => c.json({ status: "ok" }),
});
