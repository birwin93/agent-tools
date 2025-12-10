import { describe, expect, it } from "bun:test";
import { setupTestContext } from "../test-helpers";
import type { DocImportInput } from "../../src/services/doc-importer";
import type { DocWithContent } from "../../src/services/docs-service";

describe("POST /api/v1/docs/import", () => {
  it("uses the configured doc importer and returns created doc", async () => {
    class MockImporter {
      calls: DocImportInput[] = [];
      async importDoc(input: DocImportInput): Promise<{ title?: string; summary?: string; content: string }> {
        this.calls.push(input);
        return { title: input.name, summary: "summary", content: "content" };
      }
    }

    const importer = new MockImporter();
    const ctx = await setupTestContext({ docImporter: importer });

    const res = await ctx.app.request("/api/v1/docs/import", {
      method: "POST",
      body: JSON.stringify({ name: "Test Doc", url: "https://example.com" }),
      headers: { "content-type": "application/json" },
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as DocWithContent;
    expect(body.slug).toBe("test-doc");
    expect(importer.calls[0]?.url).toContain("example.com");
  });

  it("returns 500 if importer throws", async () => {
    class ThrowingImporter {
      async importDoc(): Promise<{ content: string }> {
        throw new Error("boom");
      }
    }
    const ctx = await setupTestContext({ docImporter: new ThrowingImporter() });

    const res = await ctx.app.request("/api/v1/docs/import", {
      method: "POST",
      body: JSON.stringify({ name: "Bad Doc", url: "https://example.com" }),
      headers: { "content-type": "application/json" },
    });

    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("import_failed");
  });
});
