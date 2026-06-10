import { api, type ApiResponse } from "../api";

// Public API service types
export interface NewsItem {
  _id: string;
  slug: string;
  title: string;
  content: string;
  thumbnailUrl?: string;
  category: string;
  date?: string;
  author: string;
}

export interface ProkerItem {
  _id: string;
  slug: string;
  title: string;
  description?: string;
  status: "Upcoming" | "Ongoing" | "Completed" | "Cancelled";
  startDate?: string;
  endDate?: string;
  progress?: number;
  departmentId?: {
    _id: string;
    name: string;
    code?: string;
  };
  pjId?: {
    _id: string;
    name: string;
    avatar?: string;
  };
}

export interface AspirasiItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  status: "pending" | "reviewed" | "resolved";
  createdAt: string;
  response?: string;
}

export interface StructureItem {
  id: string;
  name: string;
  role: string;
  department: string;
  photo?: string;
  bio?: string;
  socialMedia?: {
    instagram?: string;
    linkedin?: string;
    email?: string;
  };
}

export interface StatsData {
  departments: number;
  members: number;
  proker: number;
  aspirations: {
    total: number;
    pending: number;
    resolved: number;
  };
}

export interface AgendaItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  type: "meeting" | "event" | "deadline";
  description?: string;
}

// Public API service class
export class PublicApiService {
  // News (Articles) endpoints
  static async getNews(params?: {
    page?: number;
    limit?: number;
    category?: string;
  }) {
    return api.get<ApiResponse<NewsItem[]>>("/public/articles", params);
  }

  static async getNewsBySlug(slug: string) {
    return api.get<ApiResponse<NewsItem>>(`/public/articles/${slug}`);
  }

  // Proker endpoints
  static async getProkers(params?: {
    page?: number;
    limit?: number;
    department?: string;
  }) {
    return api.get<ApiResponse<ProkerItem[]>>("/public/proker", params);
  }

  static async getProkerBySlug(slug: string) {
    return api.get<ApiResponse<ProkerItem>>(`/public/proker/${slug}`);
  }

  // Aspirasi endpoints
  static async submitAspirasi(
    data: Omit<AspirasiItem, "id" | "status" | "createdAt">,
  ) {
    return api.post<ApiResponse<AspirasiItem>>("/public/aspirations", data);
  }

  // Structure endpoints
  static async getStructure(params?: { department?: string }) {
    return api.get<ApiResponse<StructureItem[]>>("/public/structure", params);
  }

  // Stats endpoint
  static async getStats() {
    return api.get<ApiResponse<StatsData>>("/public/stats");
  }

  // Agenda endpoints
  static async getAgenda(params?: {
    page?: number;
    limit?: number;
    type?: string;
  }) {
    return api.get<ApiResponse<AgendaItem[]>>("/public/agenda", params);
  }

  // Gallery endpoints
  static async getGallery(params?: {
    page?: number;
    limit?: number;
    category?: string;
  }) {
    return api.get<ApiResponse<any[]>>("/public/gallery", params);
  }

  // Contact endpoints
  static async submitContact(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    return api.post<ApiResponse<any>>("/public/contact", data);
  }
}

export default PublicApiService;
