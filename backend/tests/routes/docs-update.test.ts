import { describe, expect, it } from "bun:test";
import { DocsService } from "../../src/services/docs-service";
import { setupTestContext } from "../test-helpers";

describe("PUT /api/v1/docs/:id", () => {
  it("updates a document", async () => {
    const ctx = await setupTestContext();
    const service = new DocsService(ctx.db);
    const created = await service.createDoc({ title: "Old", summary: "Summary", content: "Content" });

    const res = await ctx.app.request(`/api/v1/docs/${created.id}`, {
      method: "PUT",
      body: JSON.stringify({ summary: "New summary" }),
      headers: { "content-type": "application/json" },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { version: number; frontmatter: { summary: string } };
    expect(body.version).toBe(2);
    expect(body.frontmatter.summary).toBe("New summary");
  });
});
