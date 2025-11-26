import { mkdir, readdir, readFile, writeFile, stat } from "fs/promises";
import { resolve } from "path";

export async function ensureDir(path: string) {
  await mkdir(path, { recursive: true });
}

export async function listMarkdownFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir);
    return entries.filter((entry) => entry.endsWith(".md")).map((entry) => resolve(dir, entry));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

export async function readTextFile(path: string): Promise<string> {
  return readFile(path, "utf8");
}

export async function writeTextFile(path: string, content: string): Promise<void> {
  await ensureDir(resolve(path, ".."));
  await writeFile(path, content, "utf8");
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw err;
  }
}
