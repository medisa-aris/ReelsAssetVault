"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { PublishSchedule } from "@/lib/types";

interface UseSchedulesParams {
  search?: string;
  status?: string;
  sort_by?: string;
  sort_dir?: string;
}

interface UseSchedulesReturn {
  schedules: PublishSchedule[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  setPage: (p: number) => void;
  refetch: () => void;
}

const LIMIT = 20;

export function useSchedules(params?: UseSchedulesParams): UseSchedulesReturn {
  const [schedules, setSchedules] = useState<PublishSchedule[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const queryParams: Record<string, string | number> = {
      page,
      limit: LIMIT,
    };
    if (params?.search) queryParams.search = params.search;
    if (params?.status) queryParams.status = params.status;
    if (params?.sort_by) queryParams.sort_by = params.sort_by;
    if (params?.sort_dir) queryParams.sort_dir = params.sort_dir;

    api
      .get("/production/schedules", { params: queryParams })
      .then((res) => {
        if (!cancelled) {
          setSchedules(res.data.items ?? []);
          setTotal(res.data.total ?? 0);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.detail ?? "Failed to load schedules");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, params?.search, params?.status, params?.sort_by, params?.sort_dir, tick]);

  return { schedules, total, page, loading, error, setPage, refetch };
}
