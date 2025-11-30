#!/usr/bin/env node
import { Command } from "commander";
import { docsSyncCommand } from "./commands/docs-sync";
import { docsListCommand } from "./commands/docs-list";
import { docsPushCommand } from "./commands/docs-push";
import { docsEditCommand } from "./commands/docs-edit";

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

type DocsEditOptions = {
  baseUrl?: string | undefined;
  editor?: string | undefined;
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

program
  .command("docs edit <id>")
  .option("--base-url <baseUrl>")
  .option("--editor <editor>", "editor command to launch")
  .action(async (id: string, options: DocsEditOptions) => {
    await docsEditCommand(id, { baseUrl: options.baseUrl, editor: options.editor });
  });

program.parse();
