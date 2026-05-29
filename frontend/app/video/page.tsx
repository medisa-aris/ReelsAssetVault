"use client";

import Navigation from "@/components/Navigation";
import VideoTable from "@/components/VideoTable";
import { PageLayout } from "@/components/PageLayout";
import { useAssets } from "@/hooks/useAssets";
import type { Asset } from "@/lib/types";
import { useState, useCallback } from "react";

export default function VideoListPage() {
  const { assets: initialAssets, total, page, loading, error, setPage } = useAssets();
  const [assets, setAssets] = useState<Asset[] | null>(null);

  const displayedAssets = assets ?? initialAssets;

  const handleAssetUpdated = useCallback((updated: Asset) => {
    setAssets((prev) => {
      const base = prev ?? initialAssets;
      return base.map((a) => (a.id === updated.id ? updated : a));
    });
  }, [initialAssets]);

  return (
    <>
      <Navigation />
      <PageLayout maxWidth="max">
        <VideoTable
          assets={displayedAssets}
          total={total}
          page={page}
          loading={loading}
          error={error}
          onPageChange={(p) => { setAssets(null); setPage(p); }}
          onAssetUpdated={handleAssetUpdated}
        />
      </PageLayout>
    </>
  );
}
