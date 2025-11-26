import { resolveConfig } from "../config";
import { listMarkdownFiles, readTextFile } from "../fs-utils";
import { parseMarkdownFile } from "../frontmatter";

export type DocsListOptions = {
  docsDir?: string;
  json?: boolean;
};

export async function docsListCommand(options: DocsListOptions) {
  const config = await resolveConfig({ docsDir: options.docsDir, baseUrl: undefined });
  const files = await listMarkdownFiles(config.docsDir);
  const docs = [] as Array<{ path: string; id?: string; slug?: string; title?: string; summary?: string; version?: number }>;

  for (const file of files) {
    const content = await readTextFile(file);
    const parsed = parseMarkdownFile(content);
    docs.push({
      path: file,
      id: parsed.frontmatter.id as string | undefined,
      slug: parsed.frontmatter.slug as string | undefined,
      title: parsed.frontmatter.title as string | undefined,
      summary: parsed.frontmatter.summary as string | undefined,
      version: parsed.frontmatter.version as number | undefined,
    });
  }

  if (options.json) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ docs }, null, 2));
  } else {
    const header = `slug        title                      summary                               version`;
    const separator = `${"-".repeat(10)}  ${"-".repeat(25)}  ${"-".repeat(36)}  ${"-".repeat(7)}`;
    // eslint-disable-next-line no-console
    console.log(header);
    // eslint-disable-next-line no-console
    console.log(separator);
    for (const doc of docs) {
      const slug = (doc.slug ?? "").padEnd(10, " ");
      const title = (doc.title ?? "").padEnd(25, " ");
      const summary = (doc.summary ?? "").padEnd(36, " ");
      const version = `${doc.version ?? ""}`.padEnd(7, " ");
      // eslint-disable-next-line no-console
      console.log(`${slug}  ${title}  ${summary}  ${version}`);
    }
  }
}
