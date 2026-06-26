// Standalone API Client for BEM FT UNESA IMS (Integrated Management System)
import { BaseImsApiService, ApiResponse, API_BASE_URL } from './api/client';
import { AuthApi } from './api/auth';
import { SuratApi } from './api/surat';
import { ProkerApi } from './api/proker';
import { KeuanganApi } from './api/keuangan';
import { RapatApi } from './api/rapat';
import { TemplateApiService, DocumentTemplate } from './api/template';

export { API_BASE_URL };
export type { ApiResponse, DocumentTemplate };

export interface RoleAssignment {
  _id: string;
  roleId: {
    _id: string;
    slug: string;
    name: string;
  };
  organizationId?: string;
  scopeType: string;
  scopeTargetId?: string;
  periodId: string;
}

export interface ActiveContext {
  assignmentId: string;
  role: {
    _id: string;
    slug: string;
    name: string;
  };
  organizationId?: string;
  scopeType: string;
  scopeTargetId?: string;
  periodId: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string | { _id: string; slug: string; name: string };
  avatar?: string;
  departmentId?: string;
  department?: string;
  cabinetPeriod?: string;
  assignments?: RoleAssignment[];
  activeContext?: ActiveContext;
  permissions?: string[];
}

export interface TelemetryData {
  cpuUsage: number;
  memoryUsage: number;
  dbStatus: string;
  uptime: number;
  apiLatency: string;
}

export interface MemberItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  departmentId?: {
    _id: string;
    name: string;
    code?: string;
  };
  status: string;
  lastLogin?: string;
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

export interface StructureBpiMember {
  _id: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface StructureDepartment {
  _id: string;
  name: string;
  code?: string;
}

export interface StructureDepartmentMember {
  _id: string;
  departmentId: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface StructureData {
  bpi: StructureBpiMember[];
  departments: StructureDepartment[];
  members: StructureDepartmentMember[];
}

export interface KeuanganItem {
  _id: string;
  tipe: 'rab' | 'lpj';
  prokerId?: { _id: string; title: string };
  status: string;
  totalAmount: number;
  items: KeuanganLineItem[];
  receipts?: string[];
  createdBy?: { _id: string; name: string };
  approvedBy?: { _id: string; name: string };
  approvalNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KeuanganLineItem {
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface ProkerItem {
  _id: string;
  title: string;
  category?: string;
  description?: string;
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  progress: number;
  targetOutput?: string;
  startDate?: string;
  endDate?: string;
  estimatedBudget?: number;
  fundingStatus?: string;
  evaluationNotes?: string;
  pic?: { _id: string; name: string; email?: string };
  department?: { _id: string; name: string };
  cabinetPeriod?: string;
  tor?: string;
  proposal?: string;
  lpj?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RapatItem {
  _id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  location: string;
  coordinates?: { latitude: number; longitude: number; radiusMeter: number };
  qrCodeActiveToken?: string;
  notulensi?: string;
  attendance?: Array<{
    userId: { _id: string; name: string; email: string; avatar?: string };
    status: 'present' | 'absent' | 'excused' | 'late';
    registeredAt?: string;
  }>;
}

export interface AssetItem {
  _id: string;
  assetCode: string;
  name: string;
  quantity: number;
  condition: 'good' | 'damaged_light' | 'damaged_heavy';
  location: string;
  loans?: Array<{
    _id: string;
    userId: { _id: string; name: string; email: string; avatar?: string };
    quantity: number;
    loanDate: string;
    dueDate: string;
    returnDate?: string;
    status: 'requested' | 'approved' | 'active' | 'returned' | 'overdue';
  }>;
}

export interface SuratItem {
  _id: string;
  title: string;
  letterNumber: string;
  type: 'incoming' | 'outgoing';
  category: 'internal' | 'external';
  sender: string;
  recipient: string;
  fileUrl: string;
  status?: string;
  notes?: string;
  bodyHtml?: string;
  submittedBy: { _id: string; name: string; email: string };
  approvedBy?: { _id: string; name: string; email: string };
  department?: { _id: string; name: string };
  cabinetPeriod: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeoItem {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
}

export interface ContentItem {
  _id: string;
  type: 'news' | 'announcement' | 'page' | 'service';
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  featuredImage?: string;
  seo?: SeoItem;
  tags?: string[];
  metadata?: Record<string, any>;
  authorId?: { _id: string; name: string; email: string };
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class ImsApiService extends BaseImsApiService {
  // Auth Api Methods
  static getProfile = AuthApi.getProfile;
  static getUsers = AuthApi.getUsers;
  static switchRole = AuthApi.switchRole;

  // Template Api Methods
  static getTemplates = TemplateApiService.getTemplates;

  // Surat Api Methods
  static getSuratList = SuratApi.getSuratList.bind(SuratApi);
  static getSuratDetail = SuratApi.getDetail.bind(SuratApi);
  static createSurat = SuratApi.createSurat.bind(SuratApi);
  static uploadDocumentVersion = SuratApi.uploadVersion.bind(SuratApi);
  static updateSurat = SuratApi.update.bind(SuratApi);
  static submitSurat = SuratApi.submit.bind(SuratApi);
  static approveSurat = SuratApi.approve.bind(SuratApi);
  static rejectSurat = SuratApi.reject.bind(SuratApi);
  static deleteSurat = SuratApi.delete.bind(SuratApi);
  static verifySuratPublic = SuratApi.verifySuratPublic.bind(SuratApi);

  // Proker Api Methods
  static getProkerList = ProkerApi.getProkerList;
  static getProkerDetail = ProkerApi.getProkerDetail;
  static createProker = ProkerApi.createProker;
  static updateProker = ProkerApi.updateProker;
  static submitProker = ProkerApi.submitProker;
  static approveProker = ProkerApi.approveProker;
  static rejectProker = ProkerApi.rejectProker;
  static deleteProker = ProkerApi.deleteProker;

  // Keuangan Api Methods
  static getKeuanganList = KeuanganApi.getKeuanganList;
  static getKeuanganDetail = KeuanganApi.getKeuanganDetail;
  static createKeuangan = KeuanganApi.createKeuangan;
  static updateKeuangan = KeuanganApi.updateKeuangan;
  static submitKeuangan = KeuanganApi.submitKeuangan;
  static approveKeuangan = KeuanganApi.approveKeuangan;
  static rejectKeuangan = KeuanganApi.rejectKeuangan;

  // Rapat Api Methods
  static getRapatList = RapatApi.getRapatList;
  static createRapat = RapatApi.createRapat;
  static getRapatDetail = RapatApi.getRapatDetail;
  static updateRapat = RapatApi.updateRapat;
  static startRapat = RapatApi.startRapat;
  static endRapat = RapatApi.endRapat;
  static getQrToken = RapatApi.getQrToken;
  static attendByQr = RapatApi.attendByQr;
  static attendManual = RapatApi.attendManual;
  static removeAttendee = RapatApi.removeAttendee;

  // General & Stats Endpoints
  static async getTelemetry(): Promise<ApiResponse<TelemetryData>> {
    return this.request<TelemetryData>("/ims/telemetry");
  }

  static async getMembers(): Promise<ApiResponse<MemberItem[]>> {
    return this.request<MemberItem[]>("/ims/members");
  }

  static async getStats(): Promise<ApiResponse<StatsData>> {
    return this.request<StatsData>("/public/stats");
  }

  static async getDashboardMetrics(): Promise<ApiResponse<any>> {
    return this.request<any>("/dashboard/metrics");
  }

  static async getStructure(): Promise<ApiResponse<StructureData>> {
    return this.request<StructureData>("/public/structure");
  }

  static async assignToBPI(userId: string, roleSlug: string): Promise<ApiResponse<any>> {
    return this.request<any>("/ims/structure/bpi", {
      method: "POST",
      body: JSON.stringify({ userId, roleSlug }),
    });
  }

  static async assignToDepartment(userId: string, departmentId: string, position: string): Promise<ApiResponse<any>> {
    return this.request<any>("/ims/structure/department", {
      method: "POST",
      body: JSON.stringify({ userId, departmentId, position }),
    });
  }

  static async removeStructureMember(userId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/ims/structure/member/${userId}`, {
      method: "DELETE",
    });
  }

  // --- Asset Endpoints ---
  static async getAssetList(): Promise<ApiResponse<AssetItem[]>> {
    return this.request<AssetItem[]>("/ims/assets");
  }

  static async getAssetDetail(id: string): Promise<ApiResponse<AssetItem>> {
    return this.request<AssetItem>(`/ims/assets/${id}`);
  }

  static async createAsset(data: Partial<AssetItem>): Promise<ApiResponse<AssetItem>> {
    return this.request<AssetItem>("/ims/assets", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async requestAssetLoan(id: string, quantity: number, dueDate: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/ims/assets/${id}/loan`, {
      method: "POST",
      body: JSON.stringify({ quantity, dueDate }),
    });
  }

  static async approveAssetLoan(id: string, loanId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/ims/assets/${id}/loan/${loanId}/approve`, { method: "POST" });
  }

  static async returnAsset(id: string, loanId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/ims/assets/${id}/loan/${loanId}/return`, { method: "POST" });
  }

  // --- Content / Berita Endpoints ---
  static async getContentList(query?: string): Promise<ApiResponse<ContentItem[]>> {
    const qs = query ? `?${query}` : '';
    return this.request<ContentItem[]>(`/contents${qs}`);
  }

  static async getContentDetail(id: string): Promise<ApiResponse<ContentItem>> {
    return this.request<ContentItem>(`/contents/${id}`);
  }

  static async createContent(data: Partial<ContentItem>): Promise<ApiResponse<ContentItem>> {
    return this.request<ContentItem>("/contents", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async updateContent(id: string, data: Partial<ContentItem>): Promise<ApiResponse<ContentItem>> {
    return this.request<ContentItem>(`/contents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  static async updateContentStatus(id: string, status: string): Promise<ApiResponse<ContentItem>> {
    return this.request<ContentItem>(`/contents/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  static async deleteContent(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/contents/${id}`, { method: "DELETE" });
  }

  // --- File Upload ---
  static async uploadFile(file: File): Promise<ApiResponse<{ url: string, _id?: string }>> {
    const url = `${API_BASE_URL}/media/upload`;
    const token = this.getToken();
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (response.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("ims_token");
          window.location.href = "/login";
        }
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        throw new Error(`Upload failed! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("File upload failed:", error);
      throw error;
    }
  }

  // --- Settings (About) ---
  static async getSettings(): Promise<ApiResponse<any>> {
    return this.request<any>("/settings");
  }

  static async updateSettings(data: any): Promise<ApiResponse<any>> {
    return this.request<any>("/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // --- Departments ---
  static async getDepartments(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/departments");
  }

  static async createDepartment(data: any): Promise<ApiResponse<any>> {
    return this.request<any>("/departments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async updateDepartment(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/departments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  static async deleteDepartment(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/departments/${id}`, { method: "DELETE" });
  }
}

export default ImsApiService;
