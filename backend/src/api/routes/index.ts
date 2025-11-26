import type { Hono } from "hono";

import type { DocsService } from "../../services/docs-service";
import { registerRoutes as attachRoutes } from "./route-builder";
import { createDocRoute } from "./create-doc";
import { getDocByIdRoute } from "./get-doc-by-id";
import { getDocBySlugRoute } from "./get-doc-by-slug";
import { healthRoute } from "./health";
import { listDocsRoute } from "./list-docs";
import { updateDocRoute } from "./update-doc";

export const routes = {
  health: healthRoute,
  listDocs: listDocsRoute,
  getDocById: getDocByIdRoute,
  getDocBySlug: getDocBySlugRoute,
  createDoc: createDocRoute,
  updateDoc: updateDocRoute,
};

const routeList = Object.values(routes);

export function registerRoutes(api: Hono, service: DocsService) {
  attachRoutes(api, service, routeList);
}
