import { ApiClient, type DocsImportApiClient } from "../api-client";
import { resolveConfig } from "../config";

export type DocsImportOptions = {
  baseUrl?: string | undefined;
  name: string;
  url: string;
  apiClient?: DocsImportApiClient;
};

function startLoading(message: string) {
  const frames = ["-", "\\", "|", "/"];
  let idx = 0;
  process.stdout.write(`${frames[idx]} ${message}`);
  const timer = setInterval(() => {
    idx = (idx + 1) % frames.length;
    process.stdout.write(`\r${frames[idx]} ${message}`);
  }, 120);

  return (success: boolean, detail?: string) => {
    clearInterval(timer);
    const prefix = success ? "[OK]" : "[ERR]";
    const suffix = !success && detail ? `: ${detail}` : "";
    process.stdout.write(`\r${prefix} ${message}${suffix}\n`);
  };
}

export async function docsImportCommand(options: DocsImportOptions) {
  if (!options.name) {
    throw new Error("--name is required");
  }
  if (!options.url) {
    throw new Error("--url is required");
  }

  const config = await resolveConfig({ baseUrl: options.baseUrl });
  const client = options.apiClient ?? new ApiClient({ baseUrl: config.baseUrl });

  const stopLoading = startLoading("Importing document");
  try {
    const result = await client.importDoc({ name: options.name, url: options.url });
    stopLoading(true);
    console.log(`Imported doc: id=${result.id}, slug=${result.slug}, version=${result.version}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    stopLoading(false, message);
    console.error("Failed to import doc:", message);
    throw err;
  }
}
