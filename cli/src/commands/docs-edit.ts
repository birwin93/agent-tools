import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { spawnSync } from "child_process";
import { ApiClient, type DocsEditApiClient } from "../api-client";
import { resolveConfig } from "../config";
import { parseMarkdownFile, stringifyMarkdown } from "../frontmatter";

export type DocsEditOptions = {
  baseUrl?: string | undefined;
  editor?: string | undefined;
  apiClient?: DocsEditApiClient;
  editFile?: (filePath: string) => Promise<void> | void;
};

function normalizeFrontmatter(frontmatter: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(frontmatter).sort(([a], [b]) => a.localeCompare(b)));
}

export async function docsEditCommand(id: string, options: DocsEditOptions) {
  const config = await resolveConfig({ baseUrl: options.baseUrl });
  const client = options.apiClient ?? new ApiClient({ baseUrl: config.baseUrl });

  const doc = await client.getDocById(id);
  const frontmatter = {
    id: doc.id,
    slug: doc.slug,
    title: doc.frontmatter.title,
    summary: doc.frontmatter.summary,
    version: doc.version,
    updatedAt: doc.updatedAt,
  };
  const originalMarkdown = stringifyMarkdown(frontmatter, `\n${doc.content}\n`);
  const originalParsed = parseMarkdownFile(originalMarkdown);

  const editDir = await mkdtemp(join(tmpdir(), "agent-tools-edit-"));
  const editPath = join(editDir, `${doc.slug || id}.md`);
  await writeFile(editPath, originalMarkdown, "utf8");

  const editorCommand = options.editor ?? process.env.EDITOR ?? process.env.VISUAL ?? "vi";
  if (options.editFile) {
    await options.editFile(editPath);
  } else {
    const result = spawnSync(`${editorCommand} ${editPath}`, {
      stdio: "inherit",
      shell: true,
    });
    if (result.error) throw result.error;
    if (typeof result.status === "number" && result.status !== 0) {
      throw new Error(`Editor exited with status ${result.status}`);
    }
  }

  const editedContent = await readFile(editPath, "utf8");
  await rm(editDir, { recursive: true, force: true });

  const editedParsed = parseMarkdownFile(editedContent);

  const originalFrontmatter = JSON.stringify(normalizeFrontmatter(originalParsed.frontmatter));
  const editedFrontmatter = JSON.stringify(normalizeFrontmatter(editedParsed.frontmatter));

  const contentChanged = originalParsed.content.trim() !== editedParsed.content.trim();
  const frontmatterChanged = originalFrontmatter !== editedFrontmatter;

  if (!contentChanged && !frontmatterChanged) {
    console.log("No changes detected; skipping update.");
    return;
  }

  const title = typeof editedParsed.frontmatter.title === "string" ? editedParsed.frontmatter.title : undefined;
  const summary =
    typeof editedParsed.frontmatter.summary === "string" ? editedParsed.frontmatter.summary : undefined;

  const updated = await client.updateDoc(id, {
    ...(title ? { title } : {}),
    ...(summary ? { summary } : {}),
    content: editedParsed.content,
  });

  console.log(`Updated doc: id=${id}, slug=${updated.slug}, version=${updated.version}`);
}
