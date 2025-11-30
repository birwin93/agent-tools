import { resolve } from "path";
import { ApiClient, type DocsSyncApiClient } from "../api-client";
import { resolveConfig } from "../config";
import { ensureDir, writeTextFile } from "../fs-utils";
import { stringifyMarkdown } from "../frontmatter";

export type DocsSyncOptions = {
  baseUrl?: string | undefined;
  docsDir?: string | undefined;
  json?: boolean | undefined;
  apiClient?: DocsSyncApiClient;
};

export async function docsSyncCommand(options: DocsSyncOptions) {
  const config = await resolveConfig({ baseUrl: options.baseUrl, docsDir: options.docsDir });
  const client = options.apiClient ?? new ApiClient({ baseUrl: config.baseUrl });

  const list = await client.listDocs();
  await ensureDir(config.docsDir);

  const results: { id: string; slug: string; path: string }[] = [];

  for (const doc of list.docs) {
    const detail = await client.getDocById(doc.id);
    const frontmatter = {
      id: detail.id,
      slug: detail.slug,
      title: detail.frontmatter.title,
      summary: detail.frontmatter.summary,
      version: detail.version,
      updatedAt: detail.updatedAt,
    };
    const markdown = stringifyMarkdown(frontmatter, `\n${detail.content}\n`);
    const filePath = resolve(config.docsDir, `${detail.slug}.md`);
    await writeTextFile(filePath, markdown);
    results.push({ id: detail.id, slug: detail.slug, path: filePath });
  }

  if (options.json) {
    console.log(JSON.stringify({ syncedCount: results.length, docsDir: config.docsDir, docs: results }, null, 2));
  } else {
    console.log(`Synced ${results.length} docs into ${config.docsDir}`);
  }
}
