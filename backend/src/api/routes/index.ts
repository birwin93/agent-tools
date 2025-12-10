import type { Hono } from "hono";

import type { DocsService } from "../../services/docs-service";
import type { DocImporter } from "../../services/doc-importer";
import { registerRoutes as attachRoutes } from "./route-builder";
import { createDocRoute } from "./create-doc";
import { getDocByIdRoute } from "./get-doc-by-id";
import { getDocBySlugRoute } from "./get-doc-by-slug";
import { healthRoute } from "./health";
import { importDocRoute } from "./import-doc";
import { listDocsRoute } from "./list-docs";
import { updateDocRoute } from "./update-doc";

export const routes = {
  health: healthRoute,
  listDocs: listDocsRoute,
  getDocById: getDocByIdRoute,
  getDocBySlug: getDocBySlugRoute,
  createDoc: createDocRoute,
  importDoc: importDocRoute,
  updateDoc: updateDocRoute,
};

const routeList = Object.values(routes);

export function registerRoutes(api: Hono, service: DocsService, docImporter: DocImporter) {
  attachRoutes(api, service, routeList, docImporter);
}
