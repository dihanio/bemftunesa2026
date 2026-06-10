"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ApiResponse,
  fetcher,
  type ListQuery,
  type QueryParams,
} from "@/lib/api";

export interface BEMEvent {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  status: "Planned" | "Upcoming" | "Completed";
  type?: "Proker" | "Event";
}

export function useEvents(query?: ListQuery) {
  return useQuery({
    queryKey: ["events", query],
    queryFn: () =>
      fetcher<ApiResponse<BEMEvent[]>>("/public/events", {
        params: query as QueryParams,
      }),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
