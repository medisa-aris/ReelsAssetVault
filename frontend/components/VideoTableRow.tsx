"use client";

import { formatDuration, formatFileSize, formatResolution, formatDate, storageUrl } from "@/lib/utils";
import type { Asset } from "@/lib/types";

interface VideoTableRowProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onPlay: (asset: Asset) => void;
}

export default function VideoTableRow({ asset, onEdit, onPlay }: VideoTableRowProps) {
  const thumb = storageUrl(asset.thumbnail_url);
  const fileUrl = (() => {
    if (asset.file_url) return storageUrl(asset.file_url);
    const ext = asset.filename.split(".").pop();
    if (ext) return storageUrl(`/storage/uploads/${asset.id}/original.${ext}`);
    return null;
  })();

  const handleDownload = () => {
    if (!fileUrl) return;
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = asset.filename;
    a.click();
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Snapshot — click to play */}
      <td className="px-4 py-3">
        <button
          onClick={() => onPlay(asset)}
          className="relative w-20 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center flex-shrink-0 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
          aria-label={`Play ${asset.title}`}
          title="Click to preview"
        >
          {/* Thumbnail */}
          {thumb ? (
            <img
              src={thumb}
              alt={asset.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.2}
                d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-60 group-hover:opacity-100 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-md">
              <svg
                className="w-3.5 h-3.5 text-gray-800 translate-x-0.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </button>
      </td>

      {/* Title */}
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900 text-sm">{asset.title}</p>
        {asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {asset.tags.slice(0, 3).map((t) => (
              <span key={t.id} className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">
                {t.name}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{asset.tags.length - 3}</span>
            )}
          </div>
        )}
      </td>

      {/* Resolution */}
      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
        {asset.width && asset.height
          ? formatResolution(asset.width, asset.height)
          : <span className="text-gray-300">—</span>}
      </td>

      {/* File size */}
      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
        {formatFileSize(asset.file_size_bytes)}
      </td>

      {/* Duration */}
      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
        {asset.duration_seconds != null
          ? formatDuration(asset.duration_seconds)
          : <span className="text-gray-300">—</span>}
      </td>

      {/* Upload date */}
      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
        {formatDate(asset.created_at)}
      </td>

      {/* Last updated by */}
      <td className="px-4 py-3 text-sm text-gray-600">
        {asset.updated_by_name ?? <span className="text-gray-300">—</span>}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(asset)}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 px-3 py-1 rounded-lg transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleDownload}
            disabled={!fileUrl}
            title={fileUrl ? "Download video" : "No file available"}
            className="text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-3 py-1 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </span>
          </button>
        </div>
      </td>
    </tr>
  );
}
