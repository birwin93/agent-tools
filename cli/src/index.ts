#!/usr/bin/env bun
import { Command } from "commander";
import { docsSyncCommand } from "./commands/docs-sync";
import { docsListCommand } from "./commands/docs-list";
import { docsPushCommand } from "./commands/docs-push";

type DocsSyncOptions = {
  baseUrl?: string | undefined;
  docsDir?: string | undefined;
  json?: boolean | undefined;
};

type DocsListOptions = {
  docsDir?: string | undefined;
  json?: boolean | undefined;
};

type DocsPushOptions = {
  baseUrl?: string | undefined;
  docsDir?: string | undefined;
  dryRun?: boolean | undefined;
};

const program = new Command();
program.name("agent-tools").description("Agent tools CLI");

program
  .command("docs sync")
  .option("--base-url <baseUrl>")
  .option("--docs-dir <docsDir>")
  .option("--json", "output json")
  .action(async (options: DocsSyncOptions) => {
    await docsSyncCommand({ baseUrl: options.baseUrl, docsDir: options.docsDir, json: options.json });
  });

program
  .command("docs list")
  .option("--docs-dir <docsDir>")
  .option("--json", "output json")
  .action(async (options: DocsListOptions) => {
    await docsListCommand({ docsDir: options.docsDir, json: options.json });
  });

program
  .command("docs push <path>")
  .option("--base-url <baseUrl>")
  .option("--docs-dir <docsDir>")
  .option("--dry-run", "dry run")
  .action(async (path: string, options: DocsPushOptions) => {
    await docsPushCommand(path, { baseUrl: options.baseUrl, docsDir: options.docsDir, dryRun: options.dryRun });
  });

program.parse();
