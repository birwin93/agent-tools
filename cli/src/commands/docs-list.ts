import { ApiClient, type DocsListApiClient } from "../api-client";
import { resolveConfig } from "../config";

export type DocsListOptions = {
  json?: boolean | undefined;
  baseUrl?: string | undefined;
  apiClient?: DocsListApiClient;
};

export async function docsListCommand(options: DocsListOptions) {
  const config = await resolveConfig({ baseUrl: options.baseUrl });
  const client = options.apiClient ?? new ApiClient({ baseUrl: config.baseUrl });
  const { docs } = await client.listDocs();

  if (options.json) {
    console.log(JSON.stringify({ docs }, null, 2));
    return;
  }

  const header = `slug        title                      version  updated`;
  const separator = `${"-".repeat(10)}  ${"-".repeat(25)}  ${"-".repeat(7)}  ${"-".repeat(24)}`;
  console.log(header);
  console.log(separator);
  for (const doc of docs) {
    const slug = (doc.slug ?? "").padEnd(10, " ");
    const title = (doc.title ?? "").padEnd(25, " ");
    const version = `${doc.version ?? ""}`.padEnd(7, " ");
    const updated = (doc.updatedAt ?? "").padEnd(24, " ");
    console.log(`${slug}  ${title}  ${version}  ${updated}`);
  }
}
