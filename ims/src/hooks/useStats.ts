import { useState, useEffect } from 'react';
import { StatsService } from '../services/StatsService';
import { StatData } from '../types/dashboard-domains';
import { ApiError } from '../lib/api/error';

interface UseStatsResult {
  data: StatData | null;
  isLoading: boolean;
  error: ApiError | null;
  isNotImplemented: boolean;
  refetch: () => Promise<void>;
}

export function useProkerStats(): UseStatsResult {
  const [data, setData] = useState<StatData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await StatsService.getProkerStats();
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
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    data,
    isLoading,
    error,
    isNotImplemented: error?.status === 501,
    refetch: fetchStats
  };
}

export function useSuratStats(): UseStatsResult {
  const [data, setData] = useState<StatData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await StatsService.getSuratStats();
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
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    data,
    isLoading,
    error,
    isNotImplemented: error?.status === 501,
    refetch: fetchStats
  };
}
