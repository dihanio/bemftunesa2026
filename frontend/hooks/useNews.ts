import { useQuery } from "@tanstack/react-query";
import { PublicApiService, type NewsItem } from "@/lib/services/public";

// Re-export for backward compatibility
export type { NewsItem } from "@/lib/services/public";

export function useNews(query?: any) {
  return useQuery({
    queryKey: ["news", query],
    queryFn: () => PublicApiService.getNews(query),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useNewsDetail(slug: string) {
  return useQuery({
    queryKey: ["news", slug],
    queryFn: () => PublicApiService.getNewsBySlug(slug),
    enabled: !!slug,
  });
}
