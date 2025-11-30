import { afterEach, describe, expect, it } from "bun:test";
import { DocsService, SlugConflictError } from "../src/services/docs-service";
import { createTestContext } from "./setup-pglite";

let cleanup: (() => Promise<void>) | null = null;

async function setupService() {
  const ctx = await createTestContext();
  cleanup = async () => ctx.close();
  return new DocsService(ctx.db);
}

afterEach(async () => {
  if (cleanup) {
    await cleanup();
    cleanup = null;
  }
});

describe("DocsService", () => {
  it("creates and lists docs", async () => {
    const service = await setupService();
    const created = await service.createDoc({ title: "Example", summary: "Use this", content: "Body" });

    expect(created.frontmatter.title).toBe("Example");
    const list = await service.listDocs();
    expect(list).toHaveLength(1);
    const [firstDoc] = list;
    expect(firstDoc?.slug).toBe(created.slug);
  });

  it("prevents slug conflicts when provided", async () => {
    const service = await setupService();
    await service.createDoc({ slug: "examples", title: "Example", summary: "Use", content: "One" });
    const duplicateCreation = service.createDoc({ slug: "examples", title: "Second", summary: "Use", content: "Two" });
    await expect(duplicateCreation).rejects.toBeInstanceOf(SlugConflictError);
  });

  it("updates docs with new versions", async () => {
    const service = await setupService();
    const created = await service.createDoc({ title: "Title", summary: "Sum", content: "content" });
    const updated = await service.updateDoc(created.id, { summary: "New sum", content: "New content" });

    expect(updated.version).toBe(2);
    expect(updated.frontmatter.summary).toBe("New sum");
    const fetched = await service.getDocById(created.id);
    expect(fetched?.version).toBe(2);
  });
});
