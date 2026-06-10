"use client";

import { useQuery } from "@tanstack/react-query";
import { fetcher, ApiResponse, QueryParams } from "@/lib/api";

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
}

export function useProker(query?: QueryParams) {
  return useQuery({
    queryKey: ["proker", query],
    queryFn: () =>
      fetcher<ApiResponse<ProkerItem[]>>("/public/proker", { params: query }),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
