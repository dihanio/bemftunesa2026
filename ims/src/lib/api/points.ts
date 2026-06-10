import { api } from "@bemft/api-client";

export interface Points {
  _id: string;
  userId: string;
  userName?: string;
  department?: string;
  points: number;
  type: "proker" | "kehadiran" | "lainnya";
  description: string;
  givenBy?: string;
  createdAt: string;
}

export interface Leaderboard {
  userId: string;
  userName: string;
  department: string;
  avatar?: string;
  totalPoints: number;
  rank?: number;
}

export interface GivePointsDto {
  userId: string;
  points: number;
  type: "proker" | "kehadiran" | "lainnya";
  description: string;
}

export const pointsService = {
  list: async (query?: Record<string, any>) => {
    return api.get<{ data: Points[] }>("/ims/points", query as any);
  },

  getLeaderboard: async () => {
    return api.get<{ data: Leaderboard[] }>("/ims/points/leaderboard");
  },

  givePoints: async (data: GivePointsDto) => {
    return api.post<{ data: Points; message: string }>("/ims/points", data);
  },

  getUserPoints: async (userId: string) => {
    return api.get<{ data: Points[] }>(`/ims/points/user/${userId}`);
  },

  delete: async (pointId: string) => {
    return api.delete<{ message: string }>(`/ims/points/${pointId}`);
  },
};
