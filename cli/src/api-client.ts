import {
  ApiClient as GeneratedApiClient,
  type CreateDocRequest,
  type DocFrontmatter,
  type DocWithContent,
  type UpdateDocRequest,
} from "./generated/api-client";

export type DocsSyncApiClient = {
  listDocs(): Promise<{ docs: DocFrontmatter[] }>;
  getDocById(id: string): Promise<DocWithContent>;
};

export type DocsPushApiClient = {
  createDoc(body: CreateDocRequest): Promise<DocWithContent>;
  updateDoc(id: string, body: UpdateDocRequest): Promise<DocWithContent>;
};

export class ApiClient extends GeneratedApiClient {}
