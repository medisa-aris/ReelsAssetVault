"use client";

import { useState } from "react";
import React from "react";
import {
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableToolbar,
  TableToolbarContent,
  Pagination,
  DataTableSkeleton,
  InlineNotification,
  Button,
  Tag,
} from "@carbon/react";
import { Add, Download } from "@carbon/icons-react";
import EditMetadataModal from "@/components/EditMetadataModal";
import VideoPlayerModal from "@/components/VideoPlayerModal";
import { formatDuration, formatFileSize, formatResolution, formatDate, storageUrl } from "@/lib/utils";
import type { Asset } from "@/lib/types";

const LIMIT = 20;

const headers = [
  { key: "snapshot", header: "Snapshot" },
  { key: "title", header: "Title" },
  { key: "resolution", header: "Resolution" },
  { key: "size", header: "Size" },
  { key: "duration", header: "Duration" },
  { key: "uploaded", header: "Uploaded" },
  { key: "updatedBy", header: "Last Updated By" },
  { key: "actions", header: "Actions" },
];

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
  // Map from row id → original Asset for custom cell rendering
  const assetMap = new Map(assets.map((a) => [a.id, a]));

  if (loading) {
    return <DataTableSkeleton columnCount={8} rowCount={10} headers={headers} />;
  }

  if (error) {
    return (
      <InlineNotification
        kind="error"
        title="Failed to load assets"
        subtitle={error}
      />
    );
  }

  const rows = assets.map((a) => ({
    id: a.id,
    snapshot: a.id, // sentinel — resolved in custom cell
    title: a.title,
    resolution: a.width && a.height ? formatResolution(a.width, a.height) : "-",
    size: formatFileSize(a.file_size_bytes),
    duration: a.duration_seconds != null ? formatDuration(a.duration_seconds) : "-",
    uploaded: formatDate(a.created_at),
    updatedBy: a.updated_by_name ?? "-",
    actions: a.id, // sentinel
  }));

  return (
    <>
      <DataTable rows={rows} headers={headers}>
        {({ rows: tableRows, headers: tableHeaders, getHeaderProps, getTableProps, getTableContainerProps, getRowProps }: any) => (
          <TableContainer
            {...getTableContainerProps()}
            title="Video Library"
            description={`${total} video${total !== 1 ? "s" : ""}`}
          >
            <TableToolbar>
              <TableToolbarContent>
                <Button renderIcon={Add} href="/video/upload" size="sm">
                  Add New Video
                </Button>
              </TableToolbarContent>
            </TableToolbar>

            {assets.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "4rem 1rem",
                  color: "var(--cds-text-secondary)",
                }}
              >
                <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🎬</p>
                <p style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "0.25rem" }}>
                  No videos yet
                </p>
                <p style={{ fontSize: "0.875rem" }}>Upload your first video to get started.</p>
              </div>
            ) : (
              <Table {...getTableProps()} size="md">
                <TableHead>
                  <TableRow>
                    {tableHeaders.map((header: { key: string; header: string }) => (
                      <TableHeader
                        key={header.key}
                        {...getHeaderProps({ header })}
                      >
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableRows.map((row: { id: string; cells: { id: string; value: unknown; info: { header: string } }[] }) => {
                    const asset = assetMap.get(row.id);
                    if (!asset) return null;
                    const fileUrl = asset.file_url
                      ? `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}${asset.file_url}`
                      : null;
                    return (
                      <TableRow key={row.id} {...getRowProps({ row })}>
                        {row.cells.map((cell) => {
                          if (cell.info.header === "snapshot") {
                            const thumb = storageUrl(asset.thumbnail_url);
                            return (
                              <TableCell key={cell.id}>
                                <button
                                  onClick={() => setPlayingAsset(asset)}
                                  style={{
                                    position: "relative",
                                    width: "5rem",
                                    height: "3rem",
                                    background: "var(--cds-layer-02)",
                                    borderRadius: "4px",
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    border: "none",
                                    padding: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                  aria-label={`Play ${asset.title}`}
                                  title="Click to preview"
                                >
                                  {thumb && (
                                    <img
                                      src={thumb}
                                      alt={asset.title}
                                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                  )}
                                  <div
                                    style={{
                                      position: "absolute",
                                      inset: 0,
                                      background: "rgba(0,0,0,0.35)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: "1.5rem",
                                        height: "1.5rem",
                                        borderRadius: "50%",
                                        background: "rgba(255,255,255,0.9)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#1c1c1c">
                                        <path d="M8 5v14l11-7z" />
                                      </svg>
                                    </div>
                                  </div>
                                </button>
                              </TableCell>
                            );
                          }

                          if (cell.info.header === "title") {
                            return (
                              <TableCell key={cell.id}>
                                <p style={{ fontWeight: 500, fontSize: "0.875rem" }}>{asset.title}</p>
                                {asset.tags.length > 0 && (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.25rem" }}>
                                    {asset.tags.slice(0, 3).map((t) => (
                                      <Tag key={t.id} type="blue" size="sm">{t.name}</Tag>
                                    ))}
                                    {asset.tags.length > 3 && (
                                      <span style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>
                                        +{asset.tags.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                            );
                          }

                          if (cell.info.header === "actions") {
                            return (
                              <TableCell key={cell.id}>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                  <Button
                                    kind="ghost"
                                    size="sm"
                                    onClick={() => setEditingAsset(asset)}
                                  >
                                    Edit
                                  </Button>
                                  {fileUrl && (
                                    <Button
                                      kind="ghost"
                                      size="sm"
                                      renderIcon={Download}
                                      iconDescription="Download"
                                      hasIconOnly
                                      onClick={() => {
                                        const a = document.createElement("a");
                                        a.href = fileUrl;
                                        a.download = asset.filename;
                                        a.click();
                                      }}
                                    />
                                  )}
                                </div>
                              </TableCell>
                            );
                          }

                          return <TableCell key={cell.id}>{cell.value as React.ReactNode}</TableCell>;
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        )}
      </DataTable>

      {total > 0 && (
        <Pagination
          totalItems={total}
          pageSize={LIMIT}
          page={page}
          pageSizes={[LIMIT]}
          onChange={({ page: p }) => onPageChange(p)}
        />
      )}

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

      {playingAsset && (
        <VideoPlayerModal
          asset={playingAsset}
          onClose={() => setPlayingAsset(null)}
        />
      )}
    </>
  );
}
