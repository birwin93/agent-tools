import type { Hono } from "hono";

import type { DocsService } from "../../services/docs-service";
import { registerRoutes as attachRoutes } from "./route-builder";
import { createDocRoute } from "./create-doc";
import { getDocByIdRoute } from "./get-doc-by-id";
import { getDocBySlugRoute } from "./get-doc-by-slug";
import { healthRoute } from "./health";
import { listDocsRoute } from "./list-docs";
import { updateDocRoute } from "./update-doc";

const routes = [healthRoute, listDocsRoute, getDocByIdRoute, getDocBySlugRoute, createDocRoute, updateDocRoute];

export function registerRoutes(api: Hono, service: DocsService) {
  attachRoutes(api, service, routes);
}
