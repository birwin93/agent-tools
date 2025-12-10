import { afterEach } from "bun:test";
import { createTestContext } from "./setup-pglite";
import type { AppOptions } from "../src/index";

let cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  const pending = cleanups;
  cleanups = [];
  await Promise.all(pending.map((fn) => fn()));
});

export async function setupTestContext(options: Partial<AppOptions> = {}) {
  const ctx = await createTestContext(options);
  cleanups.push(() => ctx.close());
  return ctx;
}

export type TestContext = Awaited<ReturnType<typeof createTestContext>>;
