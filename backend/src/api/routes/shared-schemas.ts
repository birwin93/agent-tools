import { z } from "zod";

export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
});

export const DocFrontmatterSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  version: z.number(),
  updatedAt: z.string(),
});

export const DocWithContentSchema = z.object({
  id: z.string(),
  slug: z.string(),
  version: z.number(),
  updatedAt: z.string(),
  frontmatter: z.object({
    title: z.string(),
    summary: z.string(),
  }),
  content: z.string(),
});
