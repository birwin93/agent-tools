import { z } from "zod";

export const DocFrontmatterSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  version: z.number().int().positive(),
  updatedAt: z.string(),
});

export const DocWithContentSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  version: z.number().int().positive(),
  updatedAt: z.string(),
  frontmatter: z.object({
    title: z.string(),
    summary: z.string(),
  }),
  content: z.string(),
});

export const CreateDocRequestSchema = z.object({
  slug: z.string().optional(),
  title: z.string(),
  summary: z.string(),
  content: z.string(),
});

export const UpdateDocRequestSchema = z.object({
  title: z.string().optional(),
  summary: z.string().optional(),
  content: z.string().optional(),
});

export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
});

export type DocFrontmatter = z.infer<typeof DocFrontmatterSchema>;
export type DocWithContent = z.infer<typeof DocWithContentSchema>;
export type CreateDocRequest = z.infer<typeof CreateDocRequestSchema>;
export type UpdateDocRequest = z.infer<typeof UpdateDocRequestSchema>;
