import { api } from "@bemft/api-client";

export interface WikiArticle {
  _id: string;
  title: string;
  slug: string;
  content: string;
  tags?: string[];
  authorId?: {
    _id: string;
    name: string;
    nim?: string;
    role: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const wikiService = {
  // Ambil daftar artikel Wiki/SOP
  list: async (query?: any) => {
    return api.get<{ data: WikiArticle[]; meta: any }>("/ims/wiki", query);
  },

  // Ambil detail artikel Wiki berdasarkan slug
  getDetail: async (slug: string) => {
    return api.get<{ data: WikiArticle }>(`/ims/wiki/${slug}`);
  },

  // Buat artikel Wiki/SOP baru (Sekretaris / Super Admin)
  create: async (data: Partial<WikiArticle>) => {
    return api.post<{ data: WikiArticle; message: string }>("/ims/wiki", data);
  },

  // Edit artikel Wiki (Sekretaris / Super Admin)
  update: async (id: string, data: Partial<WikiArticle>) => {
    return api.patch<{ data: WikiArticle; message: string }>(
      `/ims/wiki/${id}`,
      data,
    );
  },

  // Hapus artikel Wiki (Sekretaris / Super Admin)
  delete: async (id: string) => {
    return api.delete<{ message: string }>(`/ims/wiki/${id}`);
  },
};
