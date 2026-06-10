"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";

export interface AspirationStatus {
  id: string;
  status: "Pending" | "Reviewed" | "Done";
  category: string;
  createdAt: string;
}

export function useAspirasiStatus(id: string) {
  return useQuery({
    queryKey: ["aspiration-status", id],
    queryFn: () =>
      fetcher<{ data: AspirationStatus }>(`/public/aspirations/${id}/status`),
    enabled: !!id,
    retry: false,
  });
}

export function useSubmitAspirasi() {
  return useMutation({
    mutationFn: (data: {
      name: string;
      email?: string;
      message: string;
      category: "Akademik" | "Fasilitas" | "Organisasi" | "Lainnya";
      isAnonymous: boolean;
    }) =>
      fetcher<{ data: { id: string }; message: string }>(
        "/public/aspirations",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      ),
  });
}
