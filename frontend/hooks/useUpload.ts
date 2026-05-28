"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Asset } from "@/lib/types";

interface UploadPayload {
  file: File;
  title: string;
  description?: string;
  tagIds: string[];
}

interface UseUploadReturn {
  upload: (payload: UploadPayload) => Promise<Asset>;
  progress: number;
  uploading: boolean;
  error: string | null;
}

export function useUpload(): UseUploadReturn {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async ({ file, title, description, tagIds }: UploadPayload): Promise<Asset> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    if (description) formData.append("description", description);
    tagIds.forEach((id) => formData.append("tag_ids", id));

    try {
      const res = await api.post<Asset>("/assets/upload", formData, {
        onUploadProgress: (evt) => {
          if (evt.total) {
            setProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        },
      });
      return res.data;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Upload failed";
      setError(msg);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { upload, progress, uploading, error };
}
