import { useState, useEffect, useCallback } from 'react';
import { LetterService } from '../services/LetterService';
import { LetterData } from '../types/letter';
import { ApiError } from '../lib/api/error';

interface UseLettersResult {
  data: LetterData[];
  isLoading: boolean;
  error: ApiError | null;
  isNotImplemented: boolean;
  refetch: () => Promise<void>;
}

export function useLetters(type?: string, status?: string, dssMode?: boolean): UseLettersResult {
  const [data, setData] = useState<LetterData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchLetters = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (dssMode) {
        const res = await LetterService.getSmartPriorityLetters();
        setData(res);
      } else {
        const res = await LetterService.getLetters(type, status);
        setData(res.data);
      }
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
  }, [type, status, dssMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLetters();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchLetters]);

  return {
    data,
    isLoading,
    error,
    isNotImplemented: error?.status === 501,
    refetch: fetchLetters
  };
}

export function useRecentLetters(limit: number = 5): UseLettersResult {
  const [data, setData] = useState<LetterData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchLetters = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await LetterService.getRecentLetters(limit);
      setData(res.data);
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
  }, [limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLetters();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchLetters]);

  return {
    data,
    isLoading,
    error,
    isNotImplemented: error?.status === 501,
    refetch: fetchLetters
  };
}

export function useLetterMutations() {
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const handleError = (err: unknown) => {
    if (err instanceof ApiError) {
      setError(err);
      throw err;
    } else if (err instanceof Error) {
      const apiErr = new ApiError(500, err.message);
      setError(apiErr);
      throw apiErr;
    } else {
      const apiErr = new ApiError(500, "Unknown error occurred");
      setError(apiErr);
      throw apiErr;
    }
  };

  const create = async (data: Partial<LetterData>) => {
    try {
      setIsMutating(true);
      setError(null);
      await LetterService.createLetter(data);
    } catch (err: unknown) {
      handleError(err);
    } finally {
      setIsMutating(false);
    }
  };

  const update = async (id: string, data: Partial<LetterData>) => {
    try {
      setIsMutating(true);
      setError(null);
      await LetterService.updateLetter(id, data);
    } catch (err: unknown) {
      handleError(err);
    } finally {
      setIsMutating(false);
    }
  };

  const remove = async (id: string) => {
    try {
      setIsMutating(true);
      setError(null);
      await LetterService.deleteLetter(id);
    } catch (err: unknown) {
      handleError(err);
    } finally {
      setIsMutating(false);
    }
  };

  return {
    create,
    update,
    remove,
    isMutating,
    error,
    clearError: () => setError(null)
  };
}
