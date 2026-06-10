import { useQuery } from "@tanstack/react-query";
import { PublicApiService } from "@/lib/services/public";

export function useStats() {
  return useQuery({
    queryKey: ["public-stats"],
    queryFn: () => PublicApiService.getStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // 10 minutes
  });
}
