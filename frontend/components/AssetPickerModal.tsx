"use client";

import { useState, useEffect } from "react";
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 flex flex-col gap-4 max-h-[80vh]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Select Asset</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
        </div>

        <input
          type="text"
          placeholder="Search assets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
          {loading && <p className="text-sm text-gray-500 py-4 text-center">Loading...</p>}
          {!loading && assets.length === 0 && (
            <p className="text-sm text-gray-500 py-4 text-center">No assets found</p>
          )}
          {assets.map((asset) => (
            <button
              key={asset.id}
              onClick={() => { onSelect(asset); onClose(); }}
              className="w-full flex items-center gap-3 px-2 py-3 hover:bg-gray-50 text-left transition-colors"
            >
              {asset.thumbnail_url ? (
                <img
                  src={storageUrl(asset.thumbnail_url) ?? ""}
                  alt={asset.title}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                  No img
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">{asset.title}</p>
                <p className="text-xs text-gray-500">{asset.filename}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

