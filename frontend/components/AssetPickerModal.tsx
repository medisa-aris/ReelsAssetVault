"use client";

import { useState, useEffect } from "react";
import {
  ComposedModal,
  ModalHeader,
  ModalBody,
  Search,
  InlineLoading,
} from "@carbon/react";
import { api } from "@/lib/api";
import { Asset } from "@/lib/types";
import { storageUrl } from "@/lib/utils";

interface AssetPickerModalProps {
  open: boolean;
  onSelect: (asset: Asset) => void;
  onClose: () => void;
}

export default function AssetPickerModal({ open, onSelect, onClose }: AssetPickerModalProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get("/assets", { params: { page: 1, limit: 50, search: search || undefined } })
      .then((res) => setAssets(res.data.items ?? []))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false));
  }, [open, search]);

  return (
    <ComposedModal open={open} onClose={onClose} size="sm">
      <ModalHeader title="Select Asset" />
      <ModalBody hasScrollingContent>
        <Search
          id="asset-search"
          labelText="Search assets"
          placeholder="Search assets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="md"
          style={{ marginBottom: "1rem" }}
        />
        <div style={{ minHeight: "16rem" }}>
          {loading ? (
            <InlineLoading description="Loading assets..." />
          ) : assets.length === 0 ? (
            <p style={{ color: "var(--cds-text-placeholder)", fontSize: "0.875rem", padding: "2rem 0", textAlign: "center" }}>
              No assets found
            </p>
          ) : (
            assets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => { onSelect(asset); onClose(); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  width: "100%",
                  padding: "0.75rem 0.5rem",
                  borderBottom: "1px solid var(--cds-border-subtle-01)",
                  background: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "var(--cds-text-primary)",
                }}
              >
                {asset.thumbnail_url ? (
                  <img
                    src={storageUrl(asset.thumbnail_url) ?? ""}
                    alt={asset.title}
                    style={{ width: "3rem", height: "3rem", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: "3rem", height: "3rem", background: "var(--cds-layer-02)", borderRadius: "4px", flexShrink: 0 }} />
                )}
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>{asset.title}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>{asset.filename}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </ModalBody>
    </ComposedModal>
  );
}
