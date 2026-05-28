"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import VideoDropzone from "@/components/VideoDropzone";
import TagInput from "@/components/TagInput";
import { useUpload } from "@/hooks/useUpload";
import { formatFileSize, formatDuration, formatResolution } from "@/lib/utils";

interface AutoMeta {
  width: number | null;
  height: number | null;
  duration: number | null;
  size: number | null;
}

export default function VideoUploadPage() {
  const router = useRouter();
  const { upload, progress, uploading, error } = useUpload();

  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<AutoMeta>({ width: null, height: null, duration: null, size: null });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Extract metadata client-side when file is selected
  useEffect(() => {
    if (!file) { setMeta({ width: null, height: null, duration: null, size: null }); return; }

    setMeta({ width: null, height: null, duration: null, size: file.size });

    const url = URL.createObjectURL(file);
    const vid = document.createElement("video");
    vid.preload = "metadata";
    vid.onloadedmetadata = () => {
      setMeta({
        width: vid.videoWidth || null,
        height: vid.videoHeight || null,
        duration: isFinite(vid.duration) ? vid.duration : null,
        size: file.size,
      });
      URL.revokeObjectURL(url);
    };
    vid.onerror = () => URL.revokeObjectURL(url);
    vid.src = url;
  }, [file]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!file) { setFormError("Please select a video file"); return; }
    if (!title.trim()) { setFormError("Title is required"); return; }

    try {
      await upload({ file, title, description: description || undefined, tagIds });
      router.push("/video");
    } catch {
      // error already set by hook
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Upload New Video</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add a video to the shared library with metadata.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dropzone */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <VideoDropzone onFileSelected={setFile} selectedFile={file} />

            {/* Auto-detected metadata */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Auto-detected
              </p>
              <dl className="grid grid-cols-3 gap-4">
                <div>
                  <dt className="text-xs text-gray-400">Resolution</dt>
                  <dd className="text-sm font-medium text-gray-700 mt-0.5">
                    {meta.width && meta.height
                      ? formatResolution(meta.width, meta.height)
                      : <span className="text-gray-300">—</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Duration</dt>
                  <dd className="text-sm font-medium text-gray-700 mt-0.5">
                    {meta.duration != null
                      ? formatDuration(meta.duration)
                      : <span className="text-gray-300">—</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">File Size</dt>
                  <dd className="text-sm font-medium text-gray-700 mt-0.5">
                    {meta.size != null
                      ? formatFileSize(meta.size)
                      : <span className="text-gray-300">—</span>}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Metadata form */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Metadata
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. My Reel #1"
                maxLength={255}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description…"
                maxLength={1000}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <TagInput selectedIds={tagIds} onChange={setTagIds} />
            </div>
          </div>

          {/* Upload progress */}
          {uploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Errors */}
          {(formError || error) && (
            <p className="text-sm text-red-600">{formError ?? error}</p>
          )}

          {/* Submit buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/video")}
              disabled={uploading}
              className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  Upload Video
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
