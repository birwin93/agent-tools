import { resolve, isAbsolute } from "path";
import { ApiClient } from "../generated/api-client";
import { resolveConfig } from "../config";
import { parseMarkdownFile, stringifyMarkdown } from "../frontmatter";
import { readTextFile, writeTextFile } from "../fs-utils";

export type DocsPushOptions = {
  baseUrl?: string;
  docsDir?: string;
  dryRun?: boolean;
};

export async function docsPushCommand(filePath: string, options: DocsPushOptions) {
  const config = await resolveConfig({ baseUrl: options.baseUrl, docsDir: options.docsDir });
  const fullPath = isAbsolute(filePath) ? filePath : resolve(config.docsDir, filePath);
  const fileContent = await readTextFile(fullPath);
  const parsed = parseMarkdownFile(fileContent);
  const client = new ApiClient({ baseUrl: config.baseUrl });

  const id = parsed.frontmatter.id as string | undefined;
  const title = parsed.frontmatter.title as string | undefined;
  const summary = parsed.frontmatter.summary as string | undefined;
  const slug = parsed.frontmatter.slug as string | undefined;

  if (!id) {
    if (!title || !summary) {
      throw new Error("title and summary are required for new docs");
    }
    const payload = { slug, title, summary, content: parsed.content };
    if (options.dryRun) {
      // eslint-disable-next-line no-console
      console.log(`[dry-run] Would create doc at ${config.baseUrl}/api/v1/docs with payload`, payload);
      return;
    }
    const created = await client.createDoc(payload);
    const nextFrontmatter = {
      ...parsed.frontmatter,
      id: created.id,
      slug: created.slug,
      title: created.frontmatter.title,
      summary: created.frontmatter.summary,
      version: created.version,
      updatedAt: created.updatedAt,
    };
    const output = stringifyMarkdown(nextFrontmatter, `\n${created.content}\n`);
    await writeTextFile(fullPath, output);
    // eslint-disable-next-line no-console
    console.log(`Pushed doc: id=${created.id}, slug=${created.slug}, version=${created.version}`);
    return;
  }

  const updatePayload = {
    title: title ?? undefined,
    summary: summary ?? undefined,
    content: parsed.content,
  };

  if (options.dryRun) {
    // eslint-disable-next-line no-console
    console.log(`[dry-run] Would update doc ${id} at ${config.baseUrl}/api/v1/docs/${id} with payload`, updatePayload);
    return;
  }

  const updated = await client.updateDoc(id, updatePayload);
  const nextFrontmatter = {
    ...parsed.frontmatter,
    id,
    slug: updated.slug,
    title: updated.frontmatter.title,
    summary: updated.frontmatter.summary,
    version: updated.version,
    updatedAt: updated.updatedAt,
  };
  const output = stringifyMarkdown(nextFrontmatter, `\n${updated.content}\n`);
  await writeTextFile(fullPath, output);
  // eslint-disable-next-line no-console
  console.log(`Pushed doc: id=${id}, slug=${updated.slug}, version=${updated.version}`);
}
