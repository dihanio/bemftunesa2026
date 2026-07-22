import { useState, useEffect, useCallback } from 'react';
import { ActivityService } from '../services/ActivityService';
import { ActivityData } from '../types/dashboard-domains';
import { ApiError } from '../lib/api/error';

interface UseActivitiesResult {
  data: ActivityData[];
  isLoading: boolean;
  error: ApiError | null;
  isNotImplemented: boolean;
  refetch: () => Promise<void>;
}

export function useSystemActivities(): UseActivitiesResult {
  const [data, setData] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await ActivityService.getSystemActivities();
      setData(res);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err);
      } else if (err instanceof Error) {
        setError(new ApiError(500, err.message));
      } else {
        setError(new ApiError(500, "Unknown error occurred"));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActivities();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchActivities]);

  return {
    data,
    isLoading,
    error,
    isNotImplemented: error?.status === 501,
    refetch: fetchActivities
  };
}
