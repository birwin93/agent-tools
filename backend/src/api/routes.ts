import { z } from "zod";
import {
  ApiErrorSchema,
  CreateDocRequestSchema,
  DocFrontmatterSchema,
  DocWithContentSchema,
  UpdateDocRequestSchema,
} from "./schemas";

export type RouteDef<Req, Res> = {
  method: "GET" | "POST" | "PUT";
  path: string;
  requestSchema?: z.ZodType<Req>;
  responseSchema: z.ZodType<Res>;
};

export const routes = {
  health: {
    method: "GET",
    path: "/health",
    responseSchema: z.object({ status: z.literal("ok") }),
  } satisfies RouteDef<void, { status: "ok" }>,
  listDocs: {
    method: "GET",
    path: "/docs",
    responseSchema: z.object({ docs: z.array(DocFrontmatterSchema) }),
  } satisfies RouteDef<void, { docs: unknown[] }>,
  getDocById: {
    method: "GET",
    path: "/docs/:id",
    responseSchema: DocWithContentSchema.or(ApiErrorSchema),
  } satisfies RouteDef<void, unknown>,
  getDocBySlug: {
    method: "GET",
    path: "/docs/by-slug/:slug",
    responseSchema: DocWithContentSchema.or(ApiErrorSchema),
  } satisfies RouteDef<void, unknown>,
  createDoc: {
    method: "POST",
    path: "/docs",
    requestSchema: CreateDocRequestSchema,
    responseSchema: DocWithContentSchema.or(ApiErrorSchema),
  } satisfies RouteDef<unknown, unknown>,
  updateDoc: {
    method: "PUT",
    path: "/docs/:id",
    requestSchema: UpdateDocRequestSchema,
    responseSchema: DocWithContentSchema.or(ApiErrorSchema),
  } satisfies RouteDef<unknown, unknown>,
};
