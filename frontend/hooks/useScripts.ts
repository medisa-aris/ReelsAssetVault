"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { Script, ScriptListResponse } from "@/lib/types";

interface UseScriptsParams {
  search?: string;
  ideation_id?: string;
}

interface UseScriptsReturn {
  scripts: Script[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  setPage: (p: number) => void;
  refetch: () => void;
}

const LIMIT = 20;

export function useScripts(params: UseScriptsParams = {}): UseScriptsReturn {
  const { search, ideation_id } = params;
  const [scripts, setScripts] = useState<Script[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    setPage(1);
  }, [search, ideation_id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const queryParams: Record<string, string | number | undefined> = {
      page,
      limit: LIMIT,
    };
    if (search) queryParams.search = search;
    if (ideation_id) queryParams.ideation_id = ideation_id;

    api
      .get<ScriptListResponse>("/scripts", { params: queryParams })
      .then((res) => {
        if (!cancelled) {
          setScripts(res.data.items);
          setTotal(res.data.total);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.detail || "Failed to load scripts");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, search, ideation_id, tick]);

  return { scripts, total, page, loading, error, setPage, refetch };
}
