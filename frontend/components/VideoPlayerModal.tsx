"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { formatDuration, formatFileSize, formatResolution, storageUrl } from "@/lib/utils";
import type { Asset } from "@/lib/types";

// Lazy-load ReactPlayer (SSR disabled — it uses browser APIs)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactPlayer = dynamic<any>(() => import("react-player"), { ssr: false });

interface VideoPlayerModalProps {
  asset: Asset;
  onClose: () => void;
}

export default function VideoPlayerModal({ asset, onClose }: VideoPlayerModalProps) {
  const [playerError, setPlayerError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Prefer the explicit file_url from the API; fall back to constructing it
  // from the asset ID + filename extension (handles cached responses before
  // the backend restart that added file_url).
  const videoSrc = (() => {
    if (asset.file_url) return storageUrl(asset.file_url);
    const ext = asset.filename.split(".").pop();
    if (ext) return storageUrl(`/storage/uploads/${asset.id}/original.${ext}`);
    return null;
  })();

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const meta: string[] = [];
  if (asset.width && asset.height) meta.push(formatResolution(asset.width, asset.height));
  if (asset.duration_seconds != null) meta.push(formatDuration(asset.duration_seconds));
  meta.push(formatFileSize(asset.file_size_bytes));

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Modal container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-4xl bg-gray-950 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 py-4 bg-gray-900">
          <div className="min-w-0">
            <h2 className="text-white font-semibold text-base truncate">{asset.title}</h2>
            <p className="text-gray-400 text-xs mt-0.5">{meta.join(" · ")}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors mt-0.5"
            aria-label="Close player"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Player area */}
        <div className="w-full aspect-video bg-black relative">
          {videoSrc ? (
            <ReactPlayer
              url={videoSrc}
              width="100%"
              height="100%"
              controls
              playing={false}
              onError={() =>
                setPlayerError("Unable to load video. The file may be missing or in an unsupported format.")
              }
              config={{
                file: {
                  attributes: {
                    controlsList: "nodownload",
                    preload: "metadata",
                  },
                },
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              No video file available for this asset.
            </div>
          )}

          {/* Player error overlay */}
          {playerError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-8">
              <div className="text-center">
                <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-red-300 text-sm font-medium">{playerError}</p>
                <button
                  onClick={() => setPlayerError(null)}
                  className="mt-3 text-xs text-gray-400 hover:text-white underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-900 flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span className="truncate">{asset.filename}</span>
          {asset.mime_type && (
            <span className="ml-auto flex-shrink-0 uppercase tracking-wide">
              {asset.mime_type.split("/")[1] ?? asset.mime_type}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
