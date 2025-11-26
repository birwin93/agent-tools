import { readFile } from "fs/promises";
import { dirname, resolve } from "path";
import { homedir } from "os";

export type AgentToolsConfig = {
  baseUrl: string;
  docsDir: string;
};

const DEFAULT_CONFIG: AgentToolsConfig = {
  baseUrl: "http://localhost:3000",
  docsDir: "./docs",
};

async function loadConfigFile(): Promise<Partial<AgentToolsConfig>> {
  try {
    const configPath = resolve(homedir(), ".agent-tools", "config.json");
    const content = await readFile(configPath, "utf8");
    return JSON.parse(content) as Partial<AgentToolsConfig>;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw err;
  }
}

export async function resolveConfig(options: Partial<AgentToolsConfig>): Promise<AgentToolsConfig> {
  const fileConfig = await loadConfigFile();

  const envConfig: Partial<AgentToolsConfig> = {
    baseUrl: process.env.AGENT_TOOLS_BASE_URL,
    docsDir: process.env.AGENT_TOOLS_DOCS_DIR,
  };

  return {
    baseUrl: options.baseUrl ?? envConfig.baseUrl ?? fileConfig.baseUrl ?? DEFAULT_CONFIG.baseUrl,
    docsDir: options.docsDir ?? envConfig.docsDir ?? fileConfig.docsDir ?? DEFAULT_CONFIG.docsDir,
  } satisfies AgentToolsConfig;
}
