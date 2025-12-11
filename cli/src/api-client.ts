import {
  ApiClient as GeneratedApiClient,
  type CreateDocRequest,
  type DocFrontmatter,
  type DocWithContent,
  type ImportDocRequest,
  type UpdateDocRequest,
} from "./generated/api-client";

export type DocsListApiClient = {
  listDocs(): Promise<{ docs: DocFrontmatter[] }>;
};

export type DocsSyncApiClient = DocsListApiClient & {
  getDocById(id: string): Promise<DocWithContent>;
};

export type DocsReadApiClient = {
  getDocBySlug(slug: string): Promise<DocWithContent>;
};

export type DocsPushApiClient = {
  createDoc(body: CreateDocRequest): Promise<DocWithContent>;
  updateDoc(id: string, body: UpdateDocRequest): Promise<DocWithContent>;
};

export type DocsEditApiClient = DocsSyncApiClient & DocsPushApiClient;

export type DocsImportApiClient = {
  importDoc(body: ImportDocRequest): Promise<DocWithContent>;
};

export class ApiClient extends GeneratedApiClient {}
