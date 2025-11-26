import { describe, expect, it } from "bun:test";
import { DocsService } from "../../src/services/docs-service";
import { setupTestContext } from "../test-helpers";

describe("GET /api/v1/docs/:id", () => {
  it("retrieves a document by id", async () => {
    const ctx = await setupTestContext();
    const service = new DocsService(ctx.db);
    const created = await service.createDoc({ title: "By Id", summary: "Test", content: "Body" });

    const res = await ctx.app.request(`/api/v1/docs/${created.id}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; slug: string };
    expect(body.id).toBe(created.id);
    expect(body.slug).toBe(created.slug);
  });
});
