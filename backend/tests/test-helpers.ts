import { afterEach } from "bun:test";
import { createTestContext } from "./setup-pglite";

let cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  const pending = cleanups;
  cleanups = [];
  await Promise.all(pending.map((fn) => fn()));
});

export async function setupTestContext() {
  const ctx = await createTestContext();
  cleanups.push(() => ctx.close());
  return ctx;
}

export type TestContext = Awaited<ReturnType<typeof createTestContext>>;
