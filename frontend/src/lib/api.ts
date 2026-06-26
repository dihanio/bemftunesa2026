// Standalone API Client for BEM FT UNESA website

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;

export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    totalDocs: number;
    totalPages: number;
  };
}

export interface NewsItem {
  _id: string;
  slug: string;
  title: string;
  content: string;
  thumbnailUrl?: string;
  category: string;
  date: string;
  author: string | { _id: string; name: string; email?: string };
  summary?: string;
}

export interface ProkerItem {
  _id: string;
  slug: string;
  title: string;
  description?: string;
  status: "Upcoming" | "Ongoing" | "Completed" | "Cancelled" | "Archived";
  startDate?: string;
  endDate?: string;
  progress?: number;
  budget?: { allocated: number; expended: number };
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

export interface StructureLeader {
  _id: string;
  name: string;
  email?: string;
  role: string;
  roleSlug?: string;
  avatar?: string;
  departmentId?: string;
}

export interface Department {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  slug: string;
  headId?: {
    _id: string;
    name: string;
    role: string;
    avatar?: string;
  };
}

export interface StructureData {
  bpi: StructureLeader[];
  departments: Department[];
  members: StructureLeader[];
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
  _id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  type: string;
  description?: string;
  status?: string;
}

export interface AspirationInput {
  name?: string;
  email?: string;
  subject: string;
  message: string;
  category: string;
}

export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export class PublicApiService {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API request failed on endpoint ${endpoint}:`, error);
      throw error;
    }
  }

  // Fetch Stats
  static async getStats(): Promise<ApiResponse<StatsData>> {
    return this.request<StatsData>("/public/stats", { next: { revalidate: 60 } });
  }

  // Fetch News Articles
  static async getNews(params?: { page?: number; limit?: number; category?: string; search?: string }): Promise<ApiResponse<NewsItem[]>> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.category && params.category !== "All") query.append("category", params.category);
    if (params?.search) query.append("search", params.search);

    const queryString = query.toString() ? `?${query.toString()}` : "?type=news";
    if (!query.has("type")) {
      query.append("type", "news");
    }
    const finalQueryString = `?${query.toString()}`;
    return this.request<NewsItem[]>(`/contents/public${finalQueryString}`, { next: { revalidate: 60 } });
  }

  static async getNewsBySlug(slug: string): Promise<ApiResponse<NewsItem>> {
    return this.request<NewsItem>(`/contents/public/news/${slug}`, { next: { revalidate: 60 } });
  }

  // Fetch Prokers
  static async getProkers(params?: { page?: number; limit?: number; department?: string; search?: string }): Promise<ApiResponse<ProkerItem[]>> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.department && params.department !== "All") query.append("department", params.department);
    if (params?.search) query.append("search", params.search);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return this.request<ProkerItem[]>(`/public/proker${queryString}`, { next: { revalidate: 60 } });
  }

  static async getProkerBySlug(slug: string): Promise<ApiResponse<ProkerItem>> {
    return this.request<ProkerItem>(`/public/proker/${slug}`, { next: { revalidate: 60 } });
  }

  // Fetch Cabinet Structure
  static async getStructure(): Promise<ApiResponse<StructureData>> {
    return this.request<StructureData>("/public/structure", { next: { revalidate: 120 } });
  }

  // Fetch Agenda / Timeline
  static async getAgenda(params?: { page?: number; limit?: number }): Promise<ApiResponse<AgendaItem[]>> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return this.request<AgendaItem[]>(`/events/public${queryString}`, { next: { revalidate: 60 } });
  }

  // Fetch About Settings
  static async getAbout(): Promise<ApiResponse<any>> {
    return this.request<any>("/settings/public/about", { next: { revalidate: 60 } });
  }

  // Submit Aspiration Form
  static async submitAspirasi(data: AspirationInput): Promise<ApiResponse<{ id: string }>> {
    return this.request<{ id: string }>("/public/aspirations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Get Aspiration Status Tracker
  static async getAspirationStatus(id: string): Promise<ApiResponse<{ _id: string; status: string; category: string; createdAt: string; subject: string; message: string; response?: string }>> {
    return this.request<any>(`/public/aspirations/status/${id}`);
  }

  // Submit Contact Form
  static async submitContact(data: ContactInput): Promise<ApiResponse<any>> {
    return this.request<any>("/public/contact", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // --- Versi 2 (Content & External) API Methods ---
  static async getGallery(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<any>> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.search) query.append("search", params.search);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return this.request<any>(`/gallery/public${queryString}`, { next: { revalidate: 60 } });
  }

  static async getGalleryBySlug(slug: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/gallery/public/${slug}`, { next: { revalidate: 60 } });
  }

  static async getRecruitments(status?: string): Promise<ApiResponse<any>> {
    const query = status ? `?status=${status}` : "";
    return this.request<any>(`/recruitment/public${query}`, { next: { revalidate: 60 } });
  }

  static async getRecruitmentBySlug(slug: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/recruitment/public/${slug}`, { next: { revalidate: 60 } });
  }

  static async getPartners(type?: string): Promise<ApiResponse<any>> {
    const query = type ? `?type=${type}` : "";
    return this.request<any>(`/partners/public${query}`, { next: { revalidate: 60 } });
  }
}
export default PublicApiService;
