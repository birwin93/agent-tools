import matter from "gray-matter";

export type Frontmatter = Record<string, unknown>;

export type ParsedDoc = {
  frontmatter: Frontmatter;
  content: string;
};

export function parseMarkdownFile(text: string): ParsedDoc {
  const parsed = matter(text);
  return { frontmatter: parsed.data as Frontmatter, content: parsed.content.trimStart() };
}

export function stringifyMarkdown(frontmatter: Frontmatter, content: string): string {
  return matter.stringify(content, frontmatter);
}
