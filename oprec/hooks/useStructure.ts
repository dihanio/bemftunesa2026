"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiResponse, fetcher } from "@/lib/api";

export interface StructureLeader {
  _id: string;
  name: string;
  email?: string;
  role: string;
  avatar?: string;
  departmentId?: string;
}

export interface Department {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  slug: string;
  headId?: {
    _id: string;
    name: string;
    role: string;
    avatar?: string;
  };
}

export interface StructureData {
  bpi: StructureLeader[];
  departments: Department[];
  members?: StructureLeader[];
}

export function useStructure() {
  return useQuery({
    queryKey: ["structure"],
    queryFn: () => fetcher<ApiResponse<StructureData>>("/public/structure"),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
