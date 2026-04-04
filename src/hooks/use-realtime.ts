'use client';

// Custom hook for real-time data with Prisma
// Note: For real-time updates with PostgreSQL, you would typically use:
// 1. Polling (setInterval)
// 2. WebSockets
// 3. Server-Sent Events (SSE)
// 4. Third-party services like Supabase Realtime

import { useEffect, useState } from 'react';

export function useRealtime<T>(
  fetchFunction: () => Promise<T[]>,
  refreshInterval: number = 30000 // 30 seconds default
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetchFunction();
        setData(result);
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchData();

    // Set up polling
    const interval = setInterval(fetchData, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchFunction, refreshInterval]);

  return { data, loading, error, refetch: async () => {
    const result = await fetchFunction();
    setData(result);
  }};
}

// Hook for single document
export function useRealtimeDoc<T>(
  fetchFunction: () => Promise<T | null>,
  refreshInterval: number = 30000
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetchFunction();
        setData(result);
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchFunction, refreshInterval]);

  return { data, loading, error };
}
