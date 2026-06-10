import { api } from "@bemft/api-client";

export interface Article {
  _id: string;
  title: string;
  slug: string;
  content: string;
  thumbnailUrl?: string;
  category: "Kegiatan" | "Prestasi" | "Pengumuman" | "Opini";
  status: "Draft" | "Published";
  authorId?: any;
  createdAt: string;
  updatedAt: string;
}

export const cmsService = {
  list: async (query?: any) => {
    return api.get<{ data: Article[]; meta: any }>("/ims/articles", query);
  },

  create: async (data: Partial<Article>) => {
    return api.post<{ data: Article }>("/ims/articles", data);
  },

  update: async (id: string, data: Partial<Article>) => {
    return api.put<{ data: Article }>(`/ims/articles/${id}`, data);
  },

  delete: async (id: string) => {
    return api.delete(`/ims/articles/${id}`);
  },
};
