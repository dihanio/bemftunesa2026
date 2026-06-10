import { api } from "@bemft/api-client";

export interface Document {
  _id: string;
  title: string;
  type: "surat_masuk" | "surat_keluar" | "notulen" | "lainnya";
  content: string;
  status: "draft" | "pending" | "approved" | "rejected";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  signedBy?: string;
}

export interface CreateDocumentDto {
  title: string;
  type: "surat_masuk" | "surat_keluar" | "notulen" | "lainnya";
  content: string;
}

export const documentsService = {
  list: async (query?: Record<string, any>) => {
    return api.get<{ data: Document[]; meta?: any }>(
      "/ims/documents",
      query as any,
    );
  },

  getById: async (id: string) => {
    return api.get<{ data: Document }>(`/ims/documents/${id}`);
  },

  create: async (data: CreateDocumentDto) => {
    return api.post<{ data: Document; message: string }>(
      "/ims/documents",
      data,
    );
  },

  update: async (id: string, data: Partial<CreateDocumentDto>) => {
    return api.put<{ data: Document; message: string }>(
      `/ims/documents/${id}`,
      data,
    );
  },

  approve: async (id: string) => {
    return api.patch<{ data: Document; message: string }>(
      `/ims/documents/${id}/approve`,
      {},
    );
  },

  delete: async (id: string) => {
    return api.delete<{ message: string }>(`/ims/documents/${id}`);
  },

  listHistory: async (id: string) => {
    return api.get<{ data: any[] }>(`/ims/documents/${id}/history`);
  },

  createSnapshot: async (
    id: string,
    data: { note?: string; snapshot: any },
  ) => {
    return api.post<{ data: any; message: string }>(
      `/ims/documents/${id}/snapshots`,
      data,
    );
  },

  rollback: async (id: string, version: number) => {
    return api.post<{ data: any; message: string }>(
      `/ims/documents/${id}/rollback`,
      { version },
    );
  },
};
