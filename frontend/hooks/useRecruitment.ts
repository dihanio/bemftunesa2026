"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { ApiResponse, fetcher } from "@/lib/api";

export interface ApplicantStatusData {
  _id: string;
  fullName: string;
  nim: string;
  status: "Submitted" | "Interview" | "Accepted" | "Rejected";
}

export interface RecruitmentResultMember {
  fullName: string;
  nim: string;
}

export function useApplyRecruitment() {
  return useMutation({
    mutationFn: (data: {
      fullName: string;
      nim: string;
      email: string;
      phone?: string;
      whatsapp?: string;
      applyType: "Fungsionaris" | "Panitia";
      firstChoiceDeptId?: string;
      secondChoiceDeptId?: string;
      firstChoiceProkerId?: string;
      secondChoiceProkerId?: string;
      motivation?: string;
    }) => {
      return fetcher<ApiResponse<{ id: string; nim: string }>>(
        "/recruitment/apply",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
    },
  });
}

export function useUploadRecruitmentFiles() {
  return useMutation({
    mutationFn: (data: {
      nim: string;
      cvUrl?: string;
      photoUrl?: string;
      portfolioUrl?: string;
    }) => {
      return fetcher<ApiResponse<{ _id: string; nim: string }>>(
        "/recruitment/upload",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
    },
  });
}

export function useRecruitmentStatus(nim: string) {
  return useQuery({
    queryKey: ["recruitment-status", nim],
    queryFn: () => {
      if (!nim) throw new Error("NIM is required");
      return fetcher<ApiResponse<ApplicantStatusData>>(
        `/recruitment/status/${nim}`,
      );
    },
    enabled: !!nim,
    retry: false,
  });
}

export function useRecruitmentResults() {
  return useQuery({
    queryKey: ["recruitment-results"],
    queryFn: () => {
      return fetcher<ApiResponse<RecruitmentResultMember[]>>(
        "/recruitment/results",
      );
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
