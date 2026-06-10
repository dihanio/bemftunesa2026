import { useQuery } from "@tanstack/react-query";
import { PublicApiService } from "@/lib/services/public";

// Re-export types for backward compatibility
export type { ProkerItem } from "@/lib/services/public";
export type ProkerStatus = "Upcoming" | "Ongoing" | "Completed" | "Cancelled";

export function useProker(query?: any) {
  return useQuery({
    queryKey: ["proker", query],
    queryFn: () => PublicApiService.getProkers(query),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useProkerDetail(slug: string) {
  return useQuery({
    queryKey: ["proker", slug],
    queryFn: () => PublicApiService.getProkerBySlug(slug),
    enabled: !!slug,
  });
}
