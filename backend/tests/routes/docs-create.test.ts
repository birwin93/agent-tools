import { describe, expect, it } from "bun:test";
import { setupTestContext } from "../test-helpers";

describe("POST /api/v1/docs", () => {
  it("creates a document", async () => {
    const ctx = await setupTestContext();
    const payload = { title: "Create", summary: "New", content: "Content", project: "docs" };

    const res = await ctx.app.request("/api/v1/docs", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "content-type": "application/json" },
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; slug: string; version: number; frontmatter: { project: string | null } };
    expect(body.id).toBeDefined();
    expect(body.slug).toContain("create");
    expect(body.version).toBe(1);
    expect(body.frontmatter.project).toBe("docs");
  });
});
