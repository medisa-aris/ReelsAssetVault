"use client";

import Link from "next/link";
import Navigation from "@/components/Navigation";
import VideoTable from "@/components/VideoTable";
import { useAssets } from "@/hooks/useAssets";
import type { Asset } from "@/lib/types";
import { useState, useCallback } from "react";

export default function VideoListPage() {
  const { assets: initialAssets, total, page, loading, error, setPage, refetch } = useAssets();
  const [assets, setAssets] = useState<Asset[] | null>(null);

  // Use local state once we have edits, otherwise use hook data
  const displayedAssets = assets ?? initialAssets;

  const handleAssetUpdated = useCallback((updated: Asset) => {
    setAssets((prev) => {
      const base = prev ?? initialAssets;
      return base.map((a) => (a.id === updated.id ? updated : a));
    });
  }, [initialAssets]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Video Library</h1>
            {!loading && !error && (
              <p className="text-sm text-gray-500 mt-0.5">{total} video{total !== 1 ? "s" : ""}</p>
            )}
          </div>
          <Link
            href="/video/upload"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add New Video
          </Link>
        </div>

        <VideoTable
          assets={displayedAssets}
          total={total}
          page={page}
          loading={loading}
          error={error}
          onPageChange={(p) => { setAssets(null); setPage(p); }}
          onAssetUpdated={handleAssetUpdated}
        />
      </main>
    </div>
  );
}
