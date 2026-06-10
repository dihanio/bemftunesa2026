import { api } from "@bemft/api-client";

export interface Task {
  id: string;
  title: string;
  status: "To Do" | "In Progress" | "Done";
  division: string;
  assigneeId: string;
  points: number;
  deadline: string;
}

export interface CashEntry {
  id: string;
  title: string;
  amount: number;
  type: "Masuk" | "Keluar";
  date: string;
  notes: string;
}

export interface AssetRequest {
  id: string;
  name: string;
  quantity: number;
  status: "Pending" | "Disetujui" | "Ditolak";
  deadline: string;
}

export interface Comment {
  id: string;
  authorName: string;
  content: string;
  date: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  completedDate: string;
  status: "Belum Mulai" | "Berjalan" | "Selesai" | "Terlambat";
}

export interface KpiTarget {
  id: string;
  indicator: string;
  target: number;
  actual: number;
  unit: string;
  notes: string;
}

export interface Proker {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  departmentId: string;
  pjId?: string;
  status:
    | "Planning"
    | "Active"
    | "Event Finished"
    | "LPJ Revision"
    | "LPJ Approved"
    | "Archived"
    | "In Progress"
    | "Completed"
    | "Cancelled";
  progress: number;
  startDate?: string;
  endDate?: string;
  budget?: number;
  location?: string;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
  ledger?: CashEntry[];
  assets?: AssetRequest[];
  comments?: Comment[];
  milestones?: Milestone[];
  kpiTargets?: KpiTarget[];
  logs?: string[];
  lpjChecklist?: {
    rundown: boolean;
    rab: boolean;
    spj: boolean;
    presensi: boolean;
    kwitansi: boolean;
    dokumentasi: boolean;
  };
}

export interface ProkerFilters {
  page?: number;
  limit?: number;
  departmentId?: string;
}

export const prokerService = {
  // Ambil semua daftar proker
  list: async (filters?: ProkerFilters) => {
    return api.get<{ data: Proker[]; meta: any }>(
      "/ims/proker",
      filters as any,
    );
  },

  // Update progress dan status (Kanban Board usage)
  updateProgress: async (
    id: string,
    progress: number,
    status?: Proker["status"],
  ) => {
    return api.patch<{ data: Proker }>(`/ims/proker/${id}/progress`, {
      progress,
      status,
    });
  },

  // Buat Proker Baru
  create: async (data: Partial<Proker>) => {
    return api.post<{ data: Proker }>("/ims/proker", data);
  },

  // Edit Proker
  update: async (id: string, data: Partial<Proker>) => {
    return api.put<{ data: Proker }>(`/ims/proker/${id}`, data);
  },
};
