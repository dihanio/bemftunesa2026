import { api } from "@bemft/api-client";

export interface DashboardStats {
  totalProker: number;
  activeProker: number;
  completedProker: number;
  upcomingProker: number;
  remainingBudget: number;
  usedBudget: number;
  pendingRAB: number;
  monthlyBudgetChange: number;
  activeCommittees: number;
  ledCommittees: number;
  userPoints: number;
  monthlyPointsChange: number;
  departmentRank: number;
  totalDepartmentMembers: number;
  auditCount: number;
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  type: "success" | "upload" | "alert" | "comment";
}

export interface AgendaItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  color: "primary" | "secondary" | "tertiary";
}

export const dashboardService = {
  getStats: async () => {
    return api.get<{ data: DashboardStats }>("/ims/dashboard/stats");
  },

  getActivities: async (limit = 10) => {
    return api.get<{ data: Activity[] }>("/ims/dashboard/activities", {
      limit,
    });
  },

  getAgenda: async (limit = 5) => {
    return api.get<{ data: AgendaItem[] }>("/ims/dashboard/agenda", { limit });
  },

  getMonthlyBudget: async () => {
    return api.get<{ data: any[] }>("/ims/dashboard/monthly-budget");
  },

  getLifecycle: async () => {
    return api.get<{ data: { label: string; value: number; color: string }[] }>(
      "/ims/dashboard/lifecycle",
    );
  },

  getDepartmentAllocation: async () => {
    return api.get<{
      data: {
        departmentId: string;
        department: string;
        departmentName: string;
        plannedAmount: number;
        approvedAmount: number;
        itemCount: number;
        usagePercent: number;
      }[];
    }>("/ims/dashboard/department-allocation");
  },

  getWorkload: async () => {
    return api.get<{
      data: {
        departmentId: string;
        department: string;
        departmentName: string;
        members: number;
        assignments: number;
        loadScore: number;
        risk: "overloaded" | "watch" | "normal";
      }[];
    }>("/ims/dashboard/workload");
  },

  getMemberWorkload: async () => {
    return api.get<{
      data: {
        userId: string;
        name: string;
        role: string;
        department: string;
        assignments: number;
        loadScore: number;
        risk: "overloaded" | "inactive" | "normal";
      }[];
    }>("/ims/dashboard/workload/members");
  },

  getRisks: async () => {
    return api.get<{
      data: {
        label: string;
        value: string;
        status: "success" | "warning" | "danger";
      }[];
    }>("/ims/dashboard/risks");
  },

  getSysadminTelemetry: async () => {
    return api.get<{ data: SysadminTelemetry }>("/ims/dashboard/sysadmin");
  },

  toggleSysadminFlag: async (key: string) => {
    return api.patch<{ data: { key: string; value: boolean } }>(
      "/ims/dashboard/sysadmin/flags",
      { key }
    );
  },
};

export interface SysadminTelemetry {
  status: "HEALTHY" | "DEGRADED";
  latency: number;
  activeSessions: number;
  cpuWorkload: number;
  memoryUsage: number;
  databaseStorage: number;
  networkBandwidth: number;
  uptime: number;
  mongoStatus: string;
  auditCount: number;
  flags: {
    mfaEnforcement: boolean;
    newBudgetEngine: boolean;
    publicAspirationFlow: boolean;
    maintenanceMode: boolean;
  };
}
