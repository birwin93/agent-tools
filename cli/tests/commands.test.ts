import { afterEach, describe, expect, it } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { join, resolve } from "path";
import { tmpdir } from "os";
import { docsSyncCommand } from "../src/commands/docs-sync";
import { docsPushCommand } from "../src/commands/docs-push";
import { parseMarkdownFile } from "../src/frontmatter";
import { MockApiClient } from "./mock-api-client";

let tempDir: string | null = null;

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

describe("CLI commands", () => {
  it("syncs docs using provided API client", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "agent-tools-sync-"));
    const mockClient = new MockApiClient();
    const updatedAt = new Date().toISOString();
    mockClient.listDocsResponse = {
      docs: [
        { id: "doc-1", slug: "first", title: "First", summary: "Summary", version: 1, updatedAt },
      ],
    };
    mockClient.getDocResponse = {
      id: "doc-1",
      slug: "first",
      version: 1,
      updatedAt,
      frontmatter: { title: "First", summary: "Summary" },
      content: "Content of doc",
    };

    await docsSyncCommand({ docsDir: tempDir, apiClient: mockClient });

    const synced = await readFile(resolve(tempDir, "first.md"), "utf8");
    const parsed = parseMarkdownFile(synced);
    expect(parsed.frontmatter.id).toBe("doc-1");
    expect(parsed.frontmatter.slug).toBe("first");
    expect(parsed.content.trim()).toBe("Content of doc");
  });

  it("pushes new docs and saves returned metadata", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "agent-tools-push-"));
    const docPath = resolve(tempDir, "new-doc.md");
    await writeFile(docPath, `---\ntitle: New Doc\nsummary: Summary\n---\n\nBody content\n`);

    const mockClient = new MockApiClient();
    mockClient.createResponses.push({
      id: "created-id",
      slug: "new-doc",
      version: 1,
      updatedAt: new Date().toISOString(),
      frontmatter: { title: "New Doc", summary: "Summary" },
      content: "Body content",
    });

    await docsPushCommand(docPath, { docsDir: tempDir, apiClient: mockClient });

    expect(mockClient.createCalls).toHaveLength(1);
    const firstCreateCall = mockClient.createCalls[0];
    expect(firstCreateCall?.body.title).toBe("New Doc");

    const updated = await readFile(docPath, "utf8");
    const parsed = parseMarkdownFile(updated);
    expect(parsed.frontmatter.id).toBe("created-id");
    expect(parsed.frontmatter.version).toBe(1);
    expect(parsed.content.trim()).toBe("Body content");
  });

  it("updates existing docs", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "agent-tools-update-"));
    const docPath = resolve(tempDir, "existing.md");
    await writeFile(docPath, `---\nid: old-id\ntitle: Existing\nsummary: Old summary\n---\n\nOld body\n`);

    const mockClient = new MockApiClient();
    mockClient.updateResponses.push({
      id: "old-id",
      slug: "existing",
      version: 2,
      updatedAt: new Date().toISOString(),
      frontmatter: { title: "Existing", summary: "New summary" },
      content: "Updated body",
    });

    await docsPushCommand(docPath, { docsDir: tempDir, apiClient: mockClient });

    expect(mockClient.updateCalls).toHaveLength(1);
    const firstUpdateCall = mockClient.updateCalls[0];
    expect(firstUpdateCall?.id).toBe("old-id");
    expect(firstUpdateCall?.body.content).toContain("Old body");

    const updated = await readFile(docPath, "utf8");
    const parsed = parseMarkdownFile(updated);
    expect(parsed.frontmatter.version).toBe(2);
    expect(parsed.frontmatter.summary).toBe("New summary");
    expect(parsed.content.trim()).toBe("Updated body");
  });
});
