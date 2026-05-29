"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Button, InlineNotification } from "@carbon/react";
import { Close } from "@carbon/icons-react";
import { formatDuration, formatFileSize, formatResolution, storageUrl } from "@/lib/utils";
import type { Asset } from "@/lib/types";
import { useState } from "react";

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
    // Backdrop — click outside to close
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(4px)",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      {/* Modal container — dark (Carbon g100 theme) */}
      <div
        ref={containerRef}
        data-carbon-theme="g100"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "56rem",
          background: "#161616", // Carbon Gray 100
          borderRadius: "8px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
            padding: "1rem 1.25rem",
            background: "#262626", // Carbon Gray 90
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                fontSize: "1rem",
                fontWeight: 600,
                color: "#f4f4f4",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {asset.title}
            </h2>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#a8a8a8" }}>
              {meta.join(" · ")}
            </p>
          </div>
          <Button
            kind="ghost"
            size="sm"
            renderIcon={Close}
            iconDescription="Close player"
            hasIconOnly
            onClick={onClose}
            style={{ flexShrink: 0, color: "#a8a8a8" }}
          />
        </div>

        {/* Player area */}
        <div style={{ width: "100%", aspectRatio: "16/9", background: "#000", position: "relative" }}>
          {videoSrc ? (
            <ReactPlayer
              url={videoSrc}
              width="100%"
              height="100%"
              controls
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#6f6f6f",
                fontSize: "0.875rem",
              }}
            >
              No video file available for this asset.
            </div>
          )}

          {/* Player error overlay */}
          {playerError && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.8)",
                padding: "2rem",
              }}
            >
              <InlineNotification
                kind="error"
                title="Playback error"
                subtitle={playerError}
                onCloseButtonClick={() => setPlayerError(null)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "0.75rem 1.25rem",
            background: "#262626",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.75rem",
            color: "#6f6f6f",
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {asset.filename}
          </span>
          {asset.mime_type && (
            <span style={{ marginLeft: "auto", flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {asset.mime_type.split("/")[1] ?? asset.mime_type}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
