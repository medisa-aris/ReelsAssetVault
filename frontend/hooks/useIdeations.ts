"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { Ideation, IdeationListResponse } from "@/lib/types";

interface UseIdeationsParams {
  search?: string;
  status?: string;
  sort_by?: string;
  sort_dir?: string;
}

interface UseIdeationsReturn {
  ideations: Ideation[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  setPage: (p: number) => void;
  refetch: () => void;
}

const LIMIT = 20;

export function useIdeations(params: UseIdeationsParams = {}): UseIdeationsReturn {
  const { search, status, sort_by = "created_at", sort_dir = "desc" } = params;
  const [ideations, setIdeations] = useState<Ideation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, status, sort_by, sort_dir]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const queryParams: Record<string, string | number | undefined> = {
      page,
      limit: LIMIT,
      sort_by,
      sort_dir,
    };
    if (search) queryParams.search = search;
    if (status) queryParams.status = status;

    api
      .get<IdeationListResponse>("/ideations", { params: queryParams })
      .then((res) => {
        if (!cancelled) {
          setIdeations(res.data.items);
          setTotal(res.data.total);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.detail || "Failed to load ideations");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, search, status, sort_by, sort_dir, tick]);

  return { ideations, total, page, loading, error, setPage, refetch };
}
