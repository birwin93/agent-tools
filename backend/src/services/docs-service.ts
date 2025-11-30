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
  const base = desired || "doc";
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
  project: string | null;
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
    project: string | null;
  };
  content: string;
};

export type CreateDocInput = {
  slug?: string;
  title: string;
  summary: string;
  content: string;
  project?: string;
};

export type UpdateDocInput = {
  title?: string;
  summary?: string;
  content?: string;
};

type DocWithVersionRow = {
  doc: typeof docs.$inferSelect;
  version: typeof docVersions.$inferSelect | null;
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
        project: docs.project,
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
      project: row.project,
      version: row.version,
      updatedAt: toIsoString(row.updatedAt),
    }));
  }

  async getDocById(id: string): Promise<DocWithContent | null> {
    const row: DocWithVersionRow[] = await this.db
      .select({
        doc: docs,
        version: docVersions,
      })
      .from(docs)
      .leftJoin(docVersions, eq(docVersions.id, docs.currentVersionId))
      .where(eq(docs.id, id))
      .limit(1);

    const record = row[0];

    if (!record?.version) return null;

    return this.mapDocWithContent(record.doc, record.version);
  }

  async getDocBySlug(slug: string): Promise<DocWithContent | null> {
    const row: DocWithVersionRow[] = await this.db
      .select({
        doc: docs,
        version: docVersions,
      })
      .from(docs)
      .leftJoin(docVersions, eq(docVersions.id, docs.currentVersionId))
      .where(eq(docs.slug, slug))
      .limit(1);

    const record = row[0];

    if (!record?.version) return null;
    return this.mapDocWithContent(record.doc, record.version);
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
          project: input.project ?? null,
          updatedAt: now as unknown as Date,
        })
        .returning();

      if (!docRow) throw new Error("Failed to insert doc");

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

      if (!versionRow) throw new Error("Failed to insert doc version");

      await tx
        .update(docs)
        .set({ currentVersionId: versionRow.id, updatedAt: now as unknown as Date })
        .where(eq(docs.id, docRow.id));

      return {
        id: docRow.id,
        slug: docRow.slug,
        version: versionRow.version,
        updatedAt: new Date().toISOString(),
        frontmatter: {
          title: versionRow.title,
          summary: versionRow.summary,
          project: docRow.project,
        },
        content: versionRow.content,
      } satisfies DocWithContent;
    });
  }

  async updateDoc(id: string, input: UpdateDocInput): Promise<DocWithContent> {
    const current: DocWithVersionRow[] = await this.db
      .select({ doc: docs, version: docVersions })
      .from(docs)
      .leftJoin(docVersions, eq(docVersions.id, docs.currentVersionId))
      .where(eq(docs.id, id))
      .limit(1);

    const record = current[0];

    if (!record || !record.version) {
      throw new DocNotFoundError("Doc not found");
    }

    const { doc, version } = record;
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

      if (!newVersion) throw new Error("Failed to insert doc version");

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

      if (!updatedDoc) throw new Error("Failed to update doc");

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
        project: docRow.project,
      },
      content: versionRow.content,
    };
  }
}
