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

export interface GalleryItem {
  _id: string;
  slug: string;
  title: string;
  description?: string;
  eventDate: string;
  coverImage?: string | { url: string };
  photos?: (string | { url: string })[];
}

export interface RecruitmentItem {
  _id: string;
  slug: string;
  title: string;
  description?: string;
  status: string;
  openDate: string;
  closeDate: string;
  poster?: string | { url: string };
  period?: string;
  contactPerson?: string;
  contactWhatsapp?: string;
  formUrl?: string;
  positions?: { title: string; quota?: number; description?: string; requirements?: string }[];
  timeline?: { label: string; startDate: string; endDate?: string; order?: number }[];
}

export interface PartnerItem {
  _id: string;
  name: string;
  type: string;
  logo: string | { url: string };
  url?: string;
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
      try {
        return await response.json();
      } catch (err) {
        console.warn(`Failed to parse JSON from ${url}:`, err);
        // Return safe empty payload to avoid build-time crashes
        return { data: ({} as unknown as T) } as unknown as ApiResponse<T>;
      }
    } catch (error) {
      console.warn(`API request failed on endpoint ${endpoint}:`, error);
      // During static build or CI the API may be unreachable. Return safe empty payload to allow build to proceed.
      return { data: ({} as unknown as T) } as unknown as ApiResponse<T>;
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
  static async getAbout(): Promise<ApiResponse<unknown>> {
    return this.request<unknown>("/settings/public/about", { next: { revalidate: 60 } });
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
    return this.request<{ _id: string; status: string; category: string; createdAt: string; subject: string; message: string; response?: string }>(`/public/aspirations/status/${id}`);
  }

  // Submit Contact Form
  static async submitContact(data: ContactInput): Promise<ApiResponse<unknown>> {
    return this.request<unknown>("/public/contact", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // --- Versi 2 (Content & External) API Methods ---
  static async getGallery(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<GalleryItem[]>> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.search) query.append("search", params.search);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return this.request<GalleryItem[]>(`/gallery/public${queryString}`, { next: { revalidate: 60 } });
  }

  static async getGalleryBySlug(slug: string): Promise<ApiResponse<GalleryItem>> {
    return this.request<GalleryItem>(`/gallery/public/${slug}`, { next: { revalidate: 60 } });
  }

  static async getRecruitments(status?: string): Promise<ApiResponse<RecruitmentItem[]>> {
    const query = status ? `?status=${status}` : "";
    return this.request<RecruitmentItem[]>(`/recruitment/public${query}`, { next: { revalidate: 60 } });
  }

  static async getRecruitmentBySlug(slug: string): Promise<ApiResponse<RecruitmentItem>> {
    return this.request<RecruitmentItem>(`/recruitment/public/${slug}`, { next: { revalidate: 60 } });
  }

  static async getPartners(type?: string): Promise<ApiResponse<PartnerItem[]>> {
    const query = type ? `?type=${type}` : "";
    return this.request<PartnerItem[]>(`/partners/public${query}`, { next: { revalidate: 60 } });
  }
}
export default PublicApiService;
