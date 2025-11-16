import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineStorage } from '../utils/api';
import { NetInfo } from '@react-native-netinfo/netinfo';
import { handleApiError, ApiError } from '../utils/api';

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  retryCount?: number;
  cacheKey?: string;
  cacheTTL?: number;
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  refreshing: boolean;
  onRefresh: () => void;
}

export const useApi = <T>(
  apiFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: UseApiOptions = {}
): UseApiResult<T> => {
  const {
    immediate = true,
    onSuccess,
    onError,
    retryCount = 0,
    cacheKey,
    cacheTTL,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  const retryCountRef = useRef<number>(0);
  const mountedRef = useRef<boolean>(true);

  const executeRequest = useCallback(async (isRefresh = false) => {
    if (!mountedRef.current) return;

    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      setIsConnected(netInfo.isConnected ?? true);

      if (!netInfo.isConnected) {
        // Try to get cached data when offline
        if (cacheKey) {
          const cachedData = await offlineStorage.getCachedData(cacheKey);
          if (cachedData && mountedRef.current) {
            setData(cachedData);
            setError(null);
            setLoading(false);
            setRefreshing(false);
            return;
          }
        }
        throw new Error('No internet connection');
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      // Try cache first
      if (cacheKey && !isRefresh) {
        const cachedData = await offlineStorage.getCachedData(cacheKey);
        if (cachedData && mountedRef.current) {
          setData(cachedData);
        }
      }

      // Make API call
      const result = await apiFunction();

      if (mountedRef.current) {
        setData(result);
        setError(null);

        // Cache successful response
        if (cacheKey) {
          await offlineStorage.cacheData(cacheKey, result, cacheTTL);
        }

        onSuccess?.(result);
        retryCountRef.current = 0;
      }
    } catch (err) {
      if (!mountedRef.current) return;

      const apiError = handleApiError(err);
      setError(apiError);

      // Retry logic
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++;
        setTimeout(() => executeRequest(isRefresh), 1000 * retryCountRef.current);
        return;
      }

      onError?.(apiError);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [apiFunction, cacheKey, cacheTTL, onSuccess, onError, retryCount]);

  useEffect(() => {
    if (immediate) {
      executeRequest();
    }
  }, dependencies);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refetch = useCallback(async () => {
    await executeRequest();
  }, [executeRequest]);

  const onRefresh = useCallback(() => {
    executeRequest(true);
  }, [executeRequest]);

  return {
    data,
    loading,
    error,
    refetch,
    refreshing,
    onRefresh,
  };
};

// Hook for optimistic updates
export const useOptimisticApi = <T>(
  apiFunction: () => Promise<T>,
  optimisticData: T
): UseApiResult<T> => {
  const [data, setData] = useState<T | null>(optimisticData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const mountedRef = useRef<boolean>(true);

  const executeRequest = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const result = await apiFunction();

      if (mountedRef.current) {
        setData(result);
        onSuccess?.(result);
      }
    } catch (err) {
      if (!mountedRef.current) return;

      const apiError = handleApiError(err);
      setError(apiError);
      onError?.(apiError);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiFunction, onSuccess, onError]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch: executeRequest,
    refreshing: false,
    onRefresh: executeRequest,
  };
};

// Hook for paginated API calls
export const usePaginatedApi = <T>(
  apiFunction: (page: number, limit: number) => Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>,
  initialLimit: number = 10
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: initialLimit,
    total: 0,
    pages: 0,
    hasMore: true,
  });
  const mountedRef = useRef<boolean>(true);

  const loadPage = useCallback(async (page: number, isRefresh = false) => {
    if (!mountedRef.current) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const result = await apiFunction(page, pagination.limit);

      if (mountedRef.current) {
        const newData = isRefresh ? result.data : [...data, ...result.data];
        setData(newData);
        setPagination({
          ...result.pagination,
          hasMore: result.pagination.page < result.pagination.pages,
        });
      }
    } catch (err) {
      if (!mountedRef.current) return;

      const apiError = handleApiError(err);
      setError(apiError);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [apiFunction, pagination.limit, data]);

  const loadMore = useCallback(async () => {
    if (!pagination.hasMore || loading) return;
    await loadPage(pagination.page + 1);
  }, [loadPage, pagination.hasMore, loading]);

  const refresh = useCallback(async () => {
    setData([]);
    setPagination(prev => ({ ...prev, page: 1 }));
    await loadPage(1, true);
  }, [loadPage]);

  useEffect(() => {
    loadPage(1);
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refreshing,
    pagination,
    loadMore,
    refresh,
  };
};

// Hook for real-time data
export const useRealtimeApi = <T>(
  url: string,
  dependencies: any[] = []
): UseApiResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);
  const mountedRef = useRef<boolean>(true);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const wsUrl = url.replace('http', 'ws').replace('https', 'wss');
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          setLoading(false);
          setError(null);
        };

        wsRef.current.onmessage = (event) => {
          if (!mountedRef.current) return;

          try {
            const parsedData = JSON.parse(event.data);
            setData(parsedData);
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        wsRef.current.onerror = (err) => {
          if (!mountedRef.current) return;

          setLoading(false);
          setError(new Error('WebSocket connection error'));
        };

        wsRef.current.onclose = () => {
          if (mountedRef.current) {
            // Attempt to reconnect after 5 seconds
            setTimeout(connectWebSocket, 5000);
          }
        };
      } catch (err) {
        if (mountedRef.current) {
          setLoading(false);
          setError(new Error('Failed to establish WebSocket connection'));
        }
      }
    };

    connectWebSocket();

    return () => {
      mountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [url, ...dependencies]);

  const refetch = useCallback(async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'refetch' }));
    }
  }, []);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    data,
    loading,
    error,
    refetch,
    refreshing: false,
    onRefresh,
  };
};