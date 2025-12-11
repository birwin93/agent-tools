import { describe, expect, it } from "bun:test";
import { DocsService } from "../../src/services/docs-service";
import { setupTestContext } from "../test-helpers";

describe("GET /api/v1/docs", () => {
  it("lists existing docs", async () => {
    const ctx = await setupTestContext();
    const service = new DocsService(ctx.db);
    const created = await service.createDoc({ title: "Example", summary: "Summary", content: "Hello" });

    const res = await ctx.app.request("/api/v1/docs");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { docs: Array<{ id: string; slug: string }> };
    expect(body.docs).toHaveLength(1);
    const [firstDoc] = body.docs;
    expect(firstDoc?.id).toBe(created.id);
  });
});
