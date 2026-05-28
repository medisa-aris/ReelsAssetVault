"use client";

import { useState } from "react";
import VideoTableRow from "@/components/VideoTableRow";
import EditMetadataModal from "@/components/EditMetadataModal";
import VideoPlayerModal from "@/components/VideoPlayerModal";
import type { Asset } from "@/lib/types";

const LIMIT = 20;

interface VideoTableProps {
  assets: Asset[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  onPageChange: (p: number) => void;
  onAssetUpdated: (updated: Asset) => void;
}

export default function VideoTable({
  assets,
  total,
  page,
  loading,
  error,
  onPageChange,
  onAssetUpdated,
}: VideoTableProps) {
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [playingAsset, setPlayingAsset] = useState<Asset | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-500">
        <p className="font-medium">Failed to load assets</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="text-5xl mb-4">🎬</div>
        <h3 className="text-lg font-semibold text-gray-700">No videos yet</h3>
        <p className="text-sm text-gray-500 mt-1">
          Upload your first video to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Snapshot", "Title", "Resolution", "Size", "Duration", "Uploaded", "Last Updated By", "Actions"].map(
                (col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {assets.map((asset) => (
              <VideoTableRow
                key={asset.id}
                asset={asset}
                onEdit={setEditingAsset}
                onPlay={setPlayingAsset}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>
            Page {page} of {totalPages} &nbsp;·&nbsp; {total} videos
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              ← Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingAsset && (
        <EditMetadataModal
          asset={editingAsset}
          onClose={() => setEditingAsset(null)}
          onSaved={(updated) => {
            onAssetUpdated(updated);
            setEditingAsset(null);
          }}
        />
      )}

      {/* Video player modal */}
      {playingAsset && (
        <VideoPlayerModal
          asset={playingAsset}
          onClose={() => setPlayingAsset(null)}
        />
      )}
    </>
  );
}
