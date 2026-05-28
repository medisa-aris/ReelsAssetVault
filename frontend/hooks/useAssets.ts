"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { Asset, AssetListResponse } from "@/lib/types";

interface UseAssetsReturn {
  assets: Asset[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  setPage: (p: number) => void;
  refetch: () => void;
}

const LIMIT = 20;

export function useAssets(): UseAssetsReturn {
  const [assets, setAssets] = useState<Asset[]>([]);
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

    api
      .get<AssetListResponse>("/assets", { params: { page, limit: LIMIT } })
      .then((res) => {
        if (!cancelled) {
          setAssets(res.data.items);
          setTotal(res.data.total);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.detail || "Failed to load assets");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, tick]);

  return { assets, total, page, loading, error, setPage, refetch };
}
