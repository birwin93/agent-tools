import { ApiClient, type DocsReadApiClient } from "../api-client";
import { resolveConfig } from "../config";

export type DocsReadOptions = {
  baseUrl?: string | undefined;
  json?: boolean | undefined;
  apiClient?: DocsReadApiClient;
};

export async function docsReadCommand(slug: string, options: DocsReadOptions = {}) {
  const config = await resolveConfig({ baseUrl: options.baseUrl });
  const client = options.apiClient ?? new ApiClient({ baseUrl: config.baseUrl });
  const doc = await client.getDocBySlug(slug);

  if (options.json) {
    console.log(JSON.stringify({ doc }, null, 2));
    return;
  }

  const pretty = [
    `Title   : ${doc.frontmatter.title}`,
    `Slug    : ${doc.slug}`,
    `Version : ${doc.version}`,
    `Updated : ${doc.updatedAt}`,
    `Summary : ${doc.frontmatter.summary}`,
    "",
    doc.content,
  ];

  console.log(pretty.join("\n"));
}
