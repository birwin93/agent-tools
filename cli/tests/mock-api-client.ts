import type { DocsImportApiClient, DocsPushApiClient, DocsReadApiClient, DocsSyncApiClient } from "../src/api-client";
import type { CreateDocRequest, DocFrontmatter, DocWithContent } from "../src/generated/api-client";

type CreateDocCall = { body: CreateDocRequest };
type UpdateDocCall = { id: string; body: { title?: string; summary?: string; content?: string } };
type ImportDocCall = { body: { name: string; url: string } };

type MockResponse<T> = T | (() => T);

export class MockApiClient implements DocsSyncApiClient, DocsPushApiClient, DocsImportApiClient, DocsReadApiClient {
  listDocsResponse: MockResponse<{ docs: DocFrontmatter[] }> = { docs: [] };
  getDocResponse: MockResponse<DocWithContent> = {
    id: "doc-1",
    slug: "doc-1",
    version: 1,
    updatedAt: new Date().toISOString(),
    frontmatter: { title: "Doc", summary: "Summary" },
    content: "Content",
  };
  createResponses: MockResponse<DocWithContent>[] = [];
  updateResponses: MockResponse<DocWithContent>[] = [];
  importResponses: MockResponse<DocWithContent>[] = [];
  createCalls: CreateDocCall[] = [];
  updateCalls: UpdateDocCall[] = [];
  importCalls: ImportDocCall[] = [];

  listDocs() {
    const response =
      typeof this.listDocsResponse === "function"
        ? (this.listDocsResponse as () => { docs: DocFrontmatter[] })()
        : this.listDocsResponse;

    return Promise.resolve(response);
  }

  getDocById(id: string) {
    const base = typeof this.getDocResponse === "function" ? this.getDocResponse() : this.getDocResponse;
    return Promise.resolve({ ...base, id });
  }

  getDocBySlug(slug: string) {
    const base = typeof this.getDocResponse === "function" ? this.getDocResponse() : this.getDocResponse;
    return Promise.resolve({ ...base, slug });
  }

  createDoc(body: CreateDocRequest) {
    this.createCalls.push({ body });
    const next = this.createResponses.shift();
    if (!next) throw new Error("No create response configured");
    return Promise.resolve(typeof next === "function" ? (next as () => DocWithContent)() : next);
  }

  updateDoc(id: string, body: { title?: string; summary?: string; content?: string }) {
    this.updateCalls.push({ id, body });
    const next = this.updateResponses.shift();
    if (!next) throw new Error("No update response configured");
    const response = typeof next === "function" ? (next as () => DocWithContent)() : next;
    return Promise.resolve({ ...response, id } satisfies DocWithContent);
  }

  importDoc(body: { name: string; url: string }) {
    this.importCalls.push({ body });
    const next = this.importResponses.shift();
    if (!next) throw new Error("No import response configured");
    return Promise.resolve(typeof next === "function" ? (next as () => DocWithContent)() : next);
  }
}
