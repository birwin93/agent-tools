import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.string().regex(/^\d+$/).transform(Number).default("3000"),
  OPENROUTER_API_KEY: z.string(),
  OPENROUTER_MODEL: z.string().optional(),
  OPENROUTER_HTTP_REFERER: z.string().optional(),
  OPENROUTER_TITLE: z.string().optional(),
});

type Env = z.infer<typeof EnvSchema>;

export function parseEnv(env: NodeJS.ProcessEnv = process.env): Env {
  const result = EnvSchema.safeParse({ ...env, PORT: env.PORT ?? "3000" });
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}
