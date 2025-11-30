import { resolveConfig } from "../config";
import { listMarkdownFiles, readTextFile } from "../fs-utils";
import { parseMarkdownFile } from "../frontmatter";

export type DocsListOptions = {
  docsDir?: string | undefined;
  json?: boolean | undefined;
};

export async function docsListCommand(options: DocsListOptions) {
  const config = await resolveConfig({ docsDir: options.docsDir });
  const files = await listMarkdownFiles(config.docsDir);
  const docs: Array<{
    path: string;
    id?: string;
    slug?: string;
    title?: string;
    summary?: string;
    version?: number;
  }> = [];

  for (const file of files) {
    const content = await readTextFile(file);
    const parsed = parseMarkdownFile(content);
    const doc: {
      path: string;
      id?: string;
      slug?: string;
      title?: string;
      summary?: string;
      version?: number;
    } = {
      path: file,
    };

    const { frontmatter } = parsed;
    const id = typeof frontmatter.id === "string" ? frontmatter.id : undefined;
    const slug = typeof frontmatter.slug === "string" ? frontmatter.slug : undefined;
    const title = typeof frontmatter.title === "string" ? frontmatter.title : undefined;
    const summary = typeof frontmatter.summary === "string" ? frontmatter.summary : undefined;
    const version = typeof frontmatter.version === "number" ? frontmatter.version : undefined;

    if (id) doc.id = id;
    if (slug) doc.slug = slug;
    if (title) doc.title = title;
    if (summary) doc.summary = summary;
    if (version !== undefined) doc.version = version;

    docs.push(doc);
  }

  if (options.json) {
    console.log(JSON.stringify({ docs }, null, 2));
  } else {
    const header = `slug        title                      summary                               version`;
    const separator = `${"-".repeat(10)}  ${"-".repeat(25)}  ${"-".repeat(36)}  ${"-".repeat(7)}`;
    console.log(header);
    console.log(separator);
    for (const doc of docs) {
      const slug = (doc.slug ?? "").padEnd(10, " ");
      const title = (doc.title ?? "").padEnd(25, " ");
      const summary = (doc.summary ?? "").padEnd(36, " ");
      const version = `${doc.version ?? ""}`.padEnd(7, " ");
      console.log(`${slug}  ${title}  ${summary}  ${version}`);
    }
  }
}
