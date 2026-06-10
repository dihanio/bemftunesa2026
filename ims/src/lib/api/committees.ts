import { api } from "@bemft/api-client";

export interface Committee {
  _id: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  userName?: string;
  prokerId: string;
  prokerTitle?: string;
  role?: string;
  position?: string;
  division?: string;
  department?: string;
}

export interface WorkloadOverview {
  userId: string;
  userName: string;
  department: string;
  avatar?: string;
  committeeCount: number;
  prokers: string[];
}

export const committeesService = {
  getUserCommittees: async (userId: string) => {
    return api.get<{ data: Committee[] }>(`/ims/committees/user/${userId}`);
  },

  getProkerCommittees: async (prokerId: string) => {
    return api.get<{ data: Committee[] }>(`/ims/committees/proker/${prokerId}`);
  },

  getOverview: async () => {
    return api.get<{ data: WorkloadOverview[] }>("/ims/committees/overview");
  },

  assignMember: async (
    prokerId: string,
    data: { userId: string; roleInProker: string; division?: string },
  ) => {
    return api.post<{ message: string }>(
      `/ims/proker/${prokerId}/members`,
      data,
    );
  },
};
