import { describe, expect, it } from "bun:test";
import { setupTestContext } from "../test-helpers";

describe("GET /api/v1/health", () => {
  it("returns ok", async () => {
    const ctx = await setupTestContext();
    const res = await ctx.app.request("/api/v1/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});
