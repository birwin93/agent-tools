#!/usr/bin/env bun
import { Command } from "commander";
import { docsSyncCommand } from "./commands/docs-sync";
import { docsListCommand } from "./commands/docs-list";
import { docsPushCommand } from "./commands/docs-push";
import { docsEditCommand } from "./commands/docs-edit";
import { docsImportCommand } from "./commands/docs-import";

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

type DocsImportOptions = {
  baseUrl?: string | undefined;
  name: string;
  url: string;
};

const program = new Command();
program.name("agent-tools").description("Agent tools CLI");

const docs = program.command("docs").description("Docs commands");

docs
  .command("sync")
  .option("--base-url <baseUrl>")
  .option("--docs-dir <docsDir>")
  .option("--json", "output json")
  .action(async (options: DocsSyncOptions) => {
    await docsSyncCommand({ baseUrl: options.baseUrl, docsDir: options.docsDir, json: options.json });
  });

docs
  .command("list")
  .option("--docs-dir <docsDir>")
  .option("--json", "output json")
  .action(async (options: DocsListOptions) => {
    await docsListCommand({ docsDir: options.docsDir, json: options.json });
  });

docs
  .command("push")
  .argument("<path>")
  .option("--base-url <baseUrl>")
  .option("--docs-dir <docsDir>")
  .option("--dry-run", "dry run")
  .action(async (path: string, options: DocsPushOptions) => {
    await docsPushCommand(path, { baseUrl: options.baseUrl, docsDir: options.docsDir, dryRun: options.dryRun });
  });

docs
  .command("edit")
  .argument("<id>")
  .option("--base-url <baseUrl>")
  .option("--editor <editor>", "editor command to launch")
  .action(async (id: string, options: DocsEditOptions) => {
    await docsEditCommand(id, { baseUrl: options.baseUrl, editor: options.editor });
  });

docs
  .command("import")
  .requiredOption("--name <name>")
  .requiredOption("--url <url>")
  .option("--base-url <baseUrl>")
  .action(async (options: DocsImportOptions) => {
    await docsImportCommand({ baseUrl: options.baseUrl, name: options.name, url: options.url });
  });

if (process.argv.length <= 2) {
  program.help({ error: false });
}

program.parse();
