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
  params?: S["params"] extends ZodTypeAny ? z.infer<S["params"]> : undefined;
  query?: S["query"] extends ZodTypeAny ? z.infer<S["query"]> : undefined;
  body?: S["body"] extends ZodTypeAny ? z.infer<S["body"]> : undefined;
};

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

type AnyMiddleware = MiddlewareHandler<any, any, any, any>;

const validationErrorHandler: Parameters<typeof zValidator>[2] = (result, c) => {
  if (!result.success) {
    return c.json({ error: "validation_error", message: result.error.message } satisfies typeof ApiErrorSchema._type, 400);
  }

  return undefined;
};

function buildValidationMiddlewares(schemas?: RouteSchemas): AnyMiddleware[] {
  if (!schemas) return [];
  const handlers: AnyMiddleware[] = [];

  if (schemas.params) {
    handlers.push(zValidator("param", schemas.params, validationErrorHandler) as AnyMiddleware);
  }
  if (schemas.query) {
    handlers.push(zValidator("query", schemas.query, validationErrorHandler) as AnyMiddleware);
  }
  if (schemas.body) {
    handlers.push(zValidator("json", schemas.body, validationErrorHandler) as AnyMiddleware);
  }

  return handlers;
}

function wrapHandler<S extends RouteSchemas>(route: AppRoute<S>, service: DocsService) {
  return async (c: Context) => {
    const ctx = { c, service } as RouteContext<S> & Record<string, unknown>;
    const reqWithValidation = c.req as Context["req"] & {
      valid?: (type: "param" | "query" | "json") => unknown;
    };

    if (route.schemas?.params && reqWithValidation.valid) {
      ctx.params = reqWithValidation.valid("param") as RouteContext<S>["params"];
    }
    if (route.schemas?.query && reqWithValidation.valid) {
      ctx.query = reqWithValidation.valid("query") as RouteContext<S>["query"];
    }
    if (route.schemas?.body && reqWithValidation.valid) {
      ctx.body = reqWithValidation.valid("json") as RouteContext<S>["body"];
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
