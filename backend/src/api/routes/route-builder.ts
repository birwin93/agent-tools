import { zValidator } from "@hono/zod-validator";
import type { MiddlewareHandler, Context, Hono } from "hono";
import type { z, ZodTypeAny } from "zod";
import type { DocsService } from "../../services/docs-service";
import { ApiErrorSchema } from "./shared-schemas";

export type RouteSchemas = {
  params?: ZodTypeAny;
  query?: ZodTypeAny;
  body?: ZodTypeAny;
  responses?: Record<number, ZodTypeAny>;
};

export type RouteContext<S extends RouteSchemas> = {
  c: Context;
  service: DocsService;
} & (S["params"] extends ZodTypeAny ? { params: z.infer<S["params"]> } : {})
  & (S["query"] extends ZodTypeAny ? { query: z.infer<S["query"]> } : {})
  & (S["body"] extends ZodTypeAny ? { body: z.infer<S["body"]> } : {});

export type RouteHandler<S extends RouteSchemas> = (context: RouteContext<S>) => Promise<Response> | Response;

export type AppRoute<S extends RouteSchemas = RouteSchemas> = {
  method: "get" | "post" | "put";
  path: string;
  schemas?: S;
  handler: RouteHandler<S>;
};

export function createRoute<S extends RouteSchemas>(route: AppRoute<S>): AppRoute<S> {
  return route;
}

const validationErrorHandler: Parameters<typeof zValidator>[2] = (result, c) => {
  if (!result.success) {
    return c.json({ error: "validation_error", message: result.error.message } satisfies typeof ApiErrorSchema._type, 400);
  }
};

function buildValidationMiddlewares(schemas?: RouteSchemas): MiddlewareHandler[] {
  if (!schemas) return [];
  const handlers: MiddlewareHandler[] = [];

  if (schemas.params) {
    handlers.push(zValidator("param", schemas.params, validationErrorHandler));
  }
  if (schemas.query) {
    handlers.push(zValidator("query", schemas.query, validationErrorHandler));
  }
  if (schemas.body) {
    handlers.push(zValidator("json", schemas.body, validationErrorHandler));
  }

  return handlers;
}

function wrapHandler<S extends RouteSchemas>(route: AppRoute<S>, service: DocsService) {
  return async (c: Context) => {
    const ctx: Record<string, unknown> = { c, service };

    if (route.schemas?.params) {
      ctx.params = c.req.valid("param") as RouteContext<S>["params"];
    }
    if (route.schemas?.query) {
      ctx.query = c.req.valid("query") as RouteContext<S>["query"];
    }
    if (route.schemas?.body) {
      ctx.body = c.req.valid("json") as RouteContext<S>["body"];
    }

    return route.handler(ctx as RouteContext<S>);
  };
}

export function registerRoutes(api: Hono, service: DocsService, routes: AppRoute[] = []) {
  routes.forEach((route) => {
    const validators = buildValidationMiddlewares(route.schemas);
    const handler = wrapHandler(route, service);

    api[route.method](route.path, ...validators, handler);
  });
}
