// Standalone API Client for BEM FT UNESA IMS (Integrated Management System)
import { BaseImsApiService, ApiResponse, API_BASE_URL } from './api/client';
import { AuthApi } from './api/auth';

export { API_BASE_URL };
export type { ApiResponse };

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
  department?: { _id: string; name: string; slug: string; taskBoardUrl?: string } | string;
  cabinetPeriod?: string;
  assignments?: RoleAssignment[];
  activeContext?: ActiveContext;
  permissions?: string[];
}

export interface SettingData {
  _id: string;
  key: string;
  value: unknown;
  type?: string;
  description?: string;
}

export interface GalleryData {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  photos?: string[];
  eventDate?: string | Date;
  isPublished?: boolean;
  period?: string;
}

export interface RecruitmentData {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  poster?: string;
  status?: 'open' | 'closed' | 'announced';
  openDate?: string | Date;
  closeDate?: string | Date;
  formUrl?: string;
  positions?: { name: string; quota: number; description?: string }[];
  period?: string;
  requirements?: string[];
  content?: string;
}

export interface ApplicantData {
  _id: string; recruitmentId: string;
  name: string; nim: string; email: string; phone?: string;
  department: string; batch: string; positionChoice: string;
  motivation?: string; cv?: { url: string, filename: string }; portfolioUrl?: string;
  instagramUrl?: string; linkedinUrl?: string;
  status: string; adminNotes?: string;
  interview?: {
    scheduledAt?: string; location?: string;
    interviewerId?: string; interviewerName?: string;
    scoring?: { communication?: number; motivation?: number;
      teamwork?: number; leadership?: number; technical?: number;
      finalScore?: number; };
    notes?: string; completedAt?: string;
  };
  statusHistory: { status: string; updatedAt: string; updatedBy?: { name: string, email: string }; notes?: string; }[];
  createdAt: string;
}

export interface ApplicantStats {
  total: number; waiting_review: number; passed_review: number;
  failed_review: number; interview_scheduled: number;
  interviewed: number; accepted: number; rejected: number;
  withdrawn: number;
}

export class ImsApiService extends BaseImsApiService {
  // Auth Api Methods
  static getProfile = AuthApi.getProfile;

  static async switchRole(assignmentId: string): Promise<ApiResponse<{ token: string; activeContext: null }>> {
    return this.request<{ token: string; activeContext: null }>('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ assignmentId }),
    });
  } // Public Letter Verification API Method
  static async verifySuratPublic<TResponse = unknown>(id: string): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/public/surat/${id}/verify`);
  }

  // Department CRUD Methods
  static async getDepartments<TResponse = unknown>(): Promise<ApiResponse<TResponse[]>> {
    return this.request<TResponse[]>('/departments');
  }

  static async createDepartment<TResponse = unknown, TRequest = unknown>(data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateDepartment<TResponse = unknown, TRequest = unknown>(id: string, data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteDepartment<TResponse = unknown>(id: string): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/departments/${id}`, {
      method: 'DELETE',
    });
  }

  // Fungsionaris CRUD Methods
  static async getUsers<T = Record<string, unknown>>(departmentId?: string, search?: string): Promise<ApiResponse<T[]>> {
    let url = '/users';
    const params = new URLSearchParams();
    if (departmentId) params.append('departmentId', departmentId);
    if (search) params.append('search', search);
    
    const queryStr = params.toString();
    if (queryStr) url += `?${queryStr}`;
    
    return this.request<T[]>(url);
  }

  static async getUserById<TResponse = unknown>(id: string): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/users/${id}`);
  }

  static async createUser<TResponse = unknown, TRequest = unknown>(data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateUser<TResponse = unknown, TRequest = unknown>(id: string, data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteUser<TResponse = unknown>(id: string): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  static async getRoles<TResponse = unknown>(): Promise<ApiResponse<TResponse[]>> {
    return this.request<TResponse[]>('/users/roles');
  }

  // Document CRUD Methods
  static async getDocuments<TResponse = unknown>(
    departmentId?: string,
    category?: string,
    status?: string,
    search?: string,
  ): Promise<ApiResponse<TResponse[]>> {
    let url = '/documents';
    const params = new URLSearchParams();
    if (departmentId) params.append('departmentId', departmentId);
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const queryStr = params.toString();
    if (queryStr) url += `?${queryStr}`;

    return this.request<TResponse[]>(url);
  }

  static async getDocumentById<TResponse = unknown>(id: string): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/documents/${id}`);
  }

  static async createDocument<TResponse = unknown, TRequest = unknown>(data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>('/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateDocument<TResponse = unknown, TRequest = unknown>(id: string, data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteDocument<TResponse = unknown>(id: string): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  static async uploadDocument(file: File): Promise<ApiResponse<{ fileUrl: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Surat CRUD Methods
  static async getSurats<TResponse = unknown>(
    departmentId?: string,
    type?: string,
    category?: string,
    status?: string,
    search?: string,
  ): Promise<ApiResponse<TResponse[]>> {
    let url = '/surat';
    const params = new URLSearchParams();
    if (departmentId) params.append('departmentId', departmentId);
    if (type) params.append('type', type);
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const queryStr = params.toString();
    if (queryStr) url += `?${queryStr}`;

    return this.request<TResponse[]>(url);
  }

  static async getSuratById<TResponse = unknown>(id: string): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/surat/${id}`);
  }

  static async createSurat<TResponse = unknown, TRequest = unknown>(data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>('/surat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateSurat<TResponse = unknown, TRequest = unknown>(id: string, data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/surat/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteSurat<TResponse = unknown>(id: string): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/surat/${id}`, {
      method: 'DELETE',
    });
  }

  static async uploadSurat(file: File): Promise<ApiResponse<{ fileUrl: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/surat/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Proker CRUD Methods
  static async getProkers<T = Record<string, unknown>>(
    departmentId?: string,
    status?: string,
    cabinetPeriod?: string,
  ): Promise<ApiResponse<T[]>> {
    let url = '/ims/proker';
    const params = new URLSearchParams();
    if (departmentId) params.append('department', departmentId);
    if (status) params.append('status', status);
    if (cabinetPeriod) params.append('cabinetPeriod', cabinetPeriod);

    const queryStr = params.toString();
    if (queryStr) url += `?${queryStr}`;

    return this.request<T[]>(url);
  }

  static async getProkerById<TResponse = unknown>(id: string): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/ims/proker/${id}`);
  }

  static async createProker<TResponse = unknown, TRequest = unknown>(data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>('/ims/proker', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateProker<TResponse = unknown, TRequest = unknown>(id: string, data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/ims/proker/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteProker<TResponse = unknown>(id: string): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/ims/proker/${id}`, {
      method: 'DELETE',
    });
  }

  // Content CMS Methods
  static async getContents<TResponse = unknown>(
    type?: string,
    status?: string,
    search?: string,
  ): Promise<ApiResponse<TResponse[]>> {
    let url = '/contents';
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const queryStr = params.toString();
    if (queryStr) url += `?${queryStr}`;

    const res = await this.request<{ docs?: TResponse[]; total?: number } | TResponse[]>(url);
    if (res?.data && !Array.isArray(res.data) && 'docs' in res.data && Array.isArray(res.data.docs)) {
      return { ...res, data: res.data.docs };
    }
    // If it's already an array, we assert the shape or pass it.
    // However, to avoid 'as', let's just make it type safe.
    if (res?.data && Array.isArray(res.data)) {
        return { ...res, data: res.data };
    }
    return { ...res, data: [] };
  }

  static async getContentById<TResponse = unknown>(id: string): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/contents/${id}`);
  }

  static async createContent<TResponse = unknown, TRequest = unknown>(data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>('/contents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateContent<TResponse = unknown, TRequest = unknown>(id: string, data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/contents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async updateContentStatus<TResponse = unknown>(id: string, status: string): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/contents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  static async deleteContent<TResponse = unknown>(id: string): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/contents/${id}`, {
      method: 'DELETE',
    });
  }

  static async uploadContent(file: File): Promise<ApiResponse<{ fileUrl: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/contents/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // --- Letters (E-Surat) ---
  static async getLetters<T = Record<string, unknown>>(type?: string, status?: string, department?: string): Promise<ApiResponse<T[]>> {
    let url = '/letters';
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    if (department) params.append('department', department);

    const queryStr = params.toString();
    if (queryStr) url += `?${queryStr}`;

    return this.request<T[]>(url);
  }

  static async getLetterById<T = Record<string, unknown>>(id: string): Promise<ApiResponse<T>> {
    return this.request<T>(`/letters/${id}`);
  }

  static async createLetter<TResponse = unknown, TRequest = unknown>(data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>('/letters', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateLetter<TResponse = unknown, TRequest = unknown>(id: string, data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/letters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async deleteLetter<TResponse = unknown>(id: string): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/letters/${id}`, {
      method: 'DELETE',
    });
  }

  static async getLetterSmartPriority<T = Record<string, unknown>>(): Promise<ApiResponse<T>> {
    return this.request<T>('/letters/dss/smart');
  }

  // --- Aspirations ---
  static async getAspirations<TResponse = unknown>(
    status?: string,
    urgency?: string,
    cabinetPeriod?: string,
  ): Promise<ApiResponse<TResponse[]>> {
    let url = '/aspirations';
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (urgency) params.append('urgency', urgency);
    if (cabinetPeriod) params.append('cabinetPeriod', cabinetPeriod);

    const queryStr = params.toString();
    if (queryStr) url += `?${queryStr}`;

    return this.request<TResponse[]>(url);
  }

  static async getAspirationSawPriority<TResponse = unknown>(cabinetPeriod?: string): Promise<ApiResponse<TResponse>> {
    let url = '/aspirations/dss/saw';
    if (cabinetPeriod) url += `?cabinetPeriod=${encodeURIComponent(cabinetPeriod)}`;
    return this.request<TResponse>(url);
  }

  static async getAspirationById<TResponse = unknown>(id: string): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/aspirations/${id}`);
  }

  static async updateAspiration<TResponse = unknown, TRequest = unknown>(id: string, data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/aspirations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async deleteAspiration<TResponse = unknown>(id: string): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/aspirations/${id}`, {
      method: 'DELETE',
    });
  }

  // Partners/Sponsors CRUD Methods
  static async getPartners<TResponse = unknown>(
    type?: string,
    isActive?: boolean,
    search?: string,
  ): Promise<ApiResponse<TResponse>> {
    let url = '/partners';
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (isActive !== undefined) params.append('isActive', String(isActive));
    if (search) params.append('q', search);

    const queryStr = params.toString();
    if (queryStr) url += `?${queryStr}`;

    return this.request<TResponse>(url);
  }

  static async getPartnerById<TResponse = unknown>(id: string): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/partners/${id}`);
  }

  static async createPartner<TResponse = unknown, TRequest = unknown>(data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>('/partners', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updatePartner<TResponse = unknown, TRequest = unknown>(id: string, data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/partners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async deletePartner<TResponse = unknown>(id: string): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/partners/${id}`, {
      method: 'DELETE',
    });
  }

  // System Settings Methods
  static async getAllSettings(): Promise<ApiResponse<SettingData[]>> {
    return this.request<SettingData[]>('/settings');
  }

  static async updateSetting(key: string, data: Partial<SettingData>): Promise<ApiResponse<SettingData>> {
    return this.request<SettingData>(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async bulkUpdateSettings(settings: Partial<SettingData>[]): Promise<ApiResponse<{ processed: number }>> {
    return this.request<{ processed: number }>('/settings/bulk', {
      method: 'POST',
      body: JSON.stringify({ settings }),
    });
  }

  // Gallery CRUD Methods
  static async getGalleries(search?: string): Promise<ApiResponse<GalleryData[]>> {
    let url = '/gallery';
    if (search) url += `?search=${encodeURIComponent(search)}`;
    return this.request<GalleryData[]>(url);
  }

  static async getGalleryById(id: string): Promise<ApiResponse<GalleryData>> {
    return this.request<GalleryData>(`/gallery/${id}`);
  }

  static async createGallery(data: Partial<GalleryData>): Promise<ApiResponse<GalleryData>> {
    return this.request<GalleryData>('/gallery', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateGallery(id: string, data: Partial<GalleryData>): Promise<ApiResponse<GalleryData>> {
    return this.request<GalleryData>(`/gallery/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async deleteGallery(id: string): Promise<ApiResponse<GalleryData>> {
    return this.request<GalleryData>(`/gallery/${id}`, {
      method: 'DELETE',
    });
  }

  // Recruitment CRUD Methods
  static async getRecruitments(status?: string): Promise<ApiResponse<RecruitmentData[]>> {
    let url = '/recruitment';
    if (status) url += `?status=${encodeURIComponent(status)}`;
    return this.request<RecruitmentData[]>(url);
  }

  static async getRecruitmentById(id: string): Promise<ApiResponse<RecruitmentData>> {
    return this.request<RecruitmentData>(`/recruitment/${id}`);
  }

  static async createRecruitment(data: Partial<RecruitmentData>): Promise<ApiResponse<RecruitmentData>> {
    return this.request<RecruitmentData>('/recruitment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateRecruitment(id: string, data: Partial<RecruitmentData>): Promise<ApiResponse<RecruitmentData>> {
    return this.request<RecruitmentData>(`/recruitment/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async deleteRecruitment(id: string): Promise<ApiResponse<RecruitmentData>> {
    return this.request<RecruitmentData>(`/recruitment/${id}`, {
      method: 'DELETE',
    });
  }

  // Applicant API Methods
  static async getApplicants(recruitmentId: string, query?: string): Promise<ApiResponse<ApplicantData[]>> {
    let url = `/applicant/${recruitmentId}`;
    if (query) url += `?${query}`;
    return this.request<ApplicantData[]>(url);
  }

  static async getApplicantStats(recruitmentId: string): Promise<ApiResponse<ApplicantStats>> {
    return this.request<ApplicantStats>(`/applicant/${recruitmentId}/stats`);
  }

  static async getApplicantDetail(id: string): Promise<ApiResponse<ApplicantData>> {
    return this.request<ApplicantData>(`/applicant/detail/${id}`);
  }

  static async updateApplicantStatus(id: string, data: { status: string, notes?: string }): Promise<ApiResponse<ApplicantData>> {
    return this.request<ApplicantData>(`/applicant/detail/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async scheduleInterview(id: string, data: { scheduledAt: string, location: string, interviewerName?: string }): Promise<ApiResponse<ApplicantData>> {
    return this.request<ApplicantData>(`/applicant/detail/${id}/interview`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async submitInterviewResult(id: string, data: { scoring: Record<string, unknown>, notes?: string }): Promise<ApiResponse<ApplicantData>> {
    return this.request<ApplicantData>(`/applicant/detail/${id}/interview-result`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async setFinalResult(id: string, data: { status: string, notes?: string }): Promise<ApiResponse<ApplicantData>> {
    return this.request<ApplicantData>(`/applicant/detail/${id}/final-result`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // --- PKKMB FT 2026 Admin API Methods ---
  static async seedMaba(students: Record<string, unknown>[]): Promise<ApiResponse<{ count: number }>> {
    return this.request<{ count: number }>('/pkkmb/admin/maba/seed', {
      method: 'POST',
      body: JSON.stringify({ students }),
    });
  }

  static async getMabaList<TResponse = unknown>(): Promise<ApiResponse<TResponse[]>> {
    return this.request<TResponse[]>('/pkkmb/admin/maba');
  }

  static async resetMabaPassword<TResponse = unknown>(mabaId: string): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/pkkmb/admin/maba/${mabaId}/reset-password`, {
      method: 'POST',
    });
  }

  static async createPkkmbAttendanceEvent<TResponse = unknown, TRequest = unknown>(data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>('/pkkmb/admin/attendance/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getPkkmbAttendanceEvents<TResponse = unknown>(): Promise<ApiResponse<TResponse[]>> {
    return this.request<TResponse[]>('/pkkmb/admin/attendance/events');
  }

  static async updatePkkmbAttendanceEvent<TResponse = unknown, TRequest = unknown>(id: string, data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/pkkmb/admin/attendance/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async getPkkmbAttendanceLogs<TResponse = unknown>(eventId: string): Promise<ApiResponse<TResponse[]>> {
    return this.request<TResponse[]>(`/pkkmb/admin/attendance/logs/${eventId}`);
  }

  static async adminManualCheckinPkkmb<TResponse = unknown>(eventId: string, mabaId: string, status: string): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/pkkmb/admin/attendance/events/${eventId}/manual-checkin`, {
      method: 'POST',
      body: JSON.stringify({ mabaId, status }),
    });
  }

  static async createPkkmbAssignment<TResponse = unknown, TRequest = unknown>(data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>('/pkkmb/admin/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getPkkmbAssignments<TResponse = unknown>(): Promise<ApiResponse<TResponse[]>> {
    return this.request<TResponse[]>('/pkkmb/admin/assignments');
  }

  static async updatePkkmbAssignment<TResponse = unknown, TRequest = unknown>(id: string, data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/pkkmb/admin/assignments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async getPkkmbSubmissions<TResponse = unknown>(assignmentId: string): Promise<ApiResponse<TResponse[]>> {
    return this.request<TResponse[]>(`/pkkmb/admin/submissions/${assignmentId}`);
  }

  static async gradePkkmbSubmission<TResponse = unknown>(submissionId: string, data: { grade: number; feedback?: string }): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(`/pkkmb/admin/submissions/${submissionId}/grade`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
  // --- Committees (Kepanitiaan) ---
  static async getCommittees<T = Record<string, unknown>>(programId?: string): Promise<ApiResponse<T[]>> {
    const params = programId ? `?programId=${programId}` : '';
    return this.request<T[]>(`/committees${params}`);
  }
  static async getCommitteeByProgram<T = Record<string, unknown>>(programId: string): Promise<ApiResponse<T>> {
    return this.request<T>(`/committees/program/${programId}`);
  }
  static async getCommittee<T = Record<string, unknown>>(id: string): Promise<ApiResponse<T>> {
    return this.request<T>(`/committees/${id}`);
  }
  static async createCommittee<T = Record<string, unknown>>(data: { programId: string; name: string; description?: string; members?: { userId: string; role: string }[] }): Promise<ApiResponse<T>> {
    return this.request<T>('/committees', { method: 'POST', body: JSON.stringify(data) });
  }
  static async updateCommittee<T = Record<string, unknown>>(id: string, data: { name?: string; description?: string; isActive?: boolean }): Promise<ApiResponse<T>> {
    return this.request<T>(`/committees/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }
  static async addCommitteeMember<T = Record<string, unknown>>(id: string, data: { userId: string; role: string }): Promise<ApiResponse<T>> {
    return this.request<T>(`/committees/${id}/members`, { method: 'POST', body: JSON.stringify(data) });
  }
  static async removeCommitteeMember<T = Record<string, unknown>>(id: string, userId: string): Promise<ApiResponse<T>> {
    return this.request<T>(`/committees/${id}/members/${userId}`, { method: 'DELETE' });
  }
  static async deleteCommittee<T = Record<string, unknown>>(id: string): Promise<ApiResponse<T>> {
    return this.request<T>(`/committees/${id}`, { method: 'DELETE' });
  }

  // --- Organizations (Periode Kepengurusan) ---
  static async getOrganizations<T = Record<string, unknown>>(): Promise<ApiResponse<T[]>> {
    return this.request<T[]>('/organizations');
  }
  static async getActiveOrganization<T = Record<string, unknown>>(): Promise<ApiResponse<T>> {
    return this.request<T>('/organizations/active');
  }
  static async getOrganization<T = Record<string, unknown>>(id: string): Promise<ApiResponse<T>> {
    return this.request<T>(`/organizations/${id}`);
  }
  static async createOrganization<T = Record<string, unknown>>(data: { name: string; period: string; vision?: string; missions?: string[] }): Promise<ApiResponse<T>> {
    return this.request<T>('/organizations', { method: 'POST', body: JSON.stringify(data) });
  }
  static async updateOrganization<T = Record<string, unknown>>(id: string, data: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.request<T>(`/organizations/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }
}

export default ImsApiService;
