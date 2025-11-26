import { desc, eq, sql } from "drizzle-orm";
import { docVersions, docs, type Database } from "../db";

export class SlugConflictError extends Error {}
export class DocNotFoundError extends Error {}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(value as string).toISOString();
}

async function generateUniqueSlug(db: Database, desired: string): Promise<string> {
  let base = desired || "doc";
  let candidate = base;
  let counter = 1;
  while (true) {
    const existing = await db.select({ id: docs.id }).from(docs).where(eq(docs.slug, candidate)).limit(1);
    if (existing.length === 0) return candidate;
    candidate = `${base}-${counter}`;
    counter += 1;
  }
}

export type DocFrontmatter = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  version: number;
  updatedAt: string;
};

export type DocWithContent = {
  id: string;
  slug: string;
  version: number;
  updatedAt: string;
  frontmatter: {
    title: string;
    summary: string;
  };
  content: string;
};

export type CreateDocInput = {
  slug?: string;
  title: string;
  summary: string;
  content: string;
};

export type UpdateDocInput = {
  title?: string;
  summary?: string;
  content?: string;
};

export class DocsService {
  constructor(private db: Database) {}

  async listDocs(): Promise<DocFrontmatter[]> {
    const rows = await this.db
      .select({
        id: docs.id,
        slug: docs.slug,
        title: docs.title,
        summary: docs.summary,
        version: docVersions.version,
        updatedAt: docs.updatedAt,
      })
      .from(docs)
      .innerJoin(docVersions, eq(docVersions.id, docs.currentVersionId))
      .orderBy(desc(docs.updatedAt));

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      version: row.version,
      updatedAt: toIsoString(row.updatedAt),
    }));
  }

  async getDocById(id: string): Promise<DocWithContent | null> {
    const row = await this.db
      .select({
        doc: docs,
        version: docVersions,
      })
      .from(docs)
      .leftJoin(docVersions, eq(docVersions.id, docs.currentVersionId))
      .where(eq(docs.id, id))
      .limit(1);

    if (row.length === 0 || !row[0].version) return null;

    return this.mapDocWithContent(row[0].doc, row[0].version);
  }

  async getDocBySlug(slug: string): Promise<DocWithContent | null> {
    const row = await this.db
      .select({
        doc: docs,
        version: docVersions,
      })
      .from(docs)
      .leftJoin(docVersions, eq(docVersions.id, docs.currentVersionId))
      .where(eq(docs.slug, slug))
      .limit(1);

    if (row.length === 0 || !row[0].version) return null;
    return this.mapDocWithContent(row[0].doc, row[0].version);
  }

  async createDoc(input: CreateDocInput): Promise<DocWithContent> {
    const baseSlug = input.slug ?? slugify(input.title);
    if (input.slug) {
      const existing = await this.db.select({ id: docs.id }).from(docs).where(eq(docs.slug, input.slug)).limit(1);
      if (existing.length > 0) {
        throw new SlugConflictError("Slug already exists");
      }
    }

    const slug = await generateUniqueSlug(this.db, baseSlug);

    return this.db.transaction(async (tx) => {
      const now = sql`now()`;
      const [docRow] = await tx
        .insert(docs)
        .values({
          id: crypto.randomUUID(),
          slug,
          title: input.title,
          summary: input.summary,
          updatedAt: now as unknown as Date,
        })
        .returning();

      const [versionRow] = await tx
        .insert(docVersions)
        .values({
          id: crypto.randomUUID(),
          docId: docRow.id,
          version: 1,
          title: input.title,
          summary: input.summary,
          content: input.content,
        })
        .returning();

      await tx.update(docs).set({ currentVersionId: versionRow.id, updatedAt: now as unknown as Date }).where(eq(docs.id, docRow.id));

      return {
        id: docRow.id,
        slug: docRow.slug,
        version: versionRow.version,
        updatedAt: new Date().toISOString(),
        frontmatter: {
          title: versionRow.title,
          summary: versionRow.summary,
        },
        content: versionRow.content,
      } satisfies DocWithContent;
    });
  }

  async updateDoc(id: string, input: UpdateDocInput): Promise<DocWithContent> {
    const current = await this.db
      .select({ doc: docs, version: docVersions })
      .from(docs)
      .leftJoin(docVersions, eq(docVersions.id, docs.currentVersionId))
      .where(eq(docs.id, id))
      .limit(1);

    if (current.length === 0 || !current[0].version) {
      throw new DocNotFoundError("Doc not found");
    }

    const { doc, version } = current[0];
    const nextTitle = input.title ?? version.title;
    const nextSummary = input.summary ?? version.summary;
    const nextContent = input.content ?? version.content;
    const nextVersionNumber = version.version + 1;

    return this.db.transaction(async (tx) => {
      const [newVersion] = await tx
        .insert(docVersions)
        .values({
          id: crypto.randomUUID(),
          docId: doc.id,
          version: nextVersionNumber,
          title: nextTitle,
          summary: nextSummary,
          content: nextContent,
        })
        .returning();

      const [updatedDoc] = await tx
        .update(docs)
        .set({
          title: nextTitle,
          summary: nextSummary,
          currentVersionId: newVersion.id,
          updatedAt: sql`now()` as unknown as Date,
        })
        .where(eq(docs.id, doc.id))
        .returning();

      return this.mapDocWithContent(updatedDoc, newVersion);
    });
  }

  private mapDocWithContent(docRow: typeof docs.$inferSelect, versionRow: typeof docVersions.$inferSelect): DocWithContent {
    return {
      id: docRow.id,
      slug: docRow.slug,
      version: versionRow.version,
      updatedAt: toIsoString(docRow.updatedAt),
      frontmatter: {
        title: versionRow.title,
        summary: versionRow.summary,
      },
      content: versionRow.content,
    };
  }
}
