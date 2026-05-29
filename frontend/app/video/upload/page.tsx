"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Form,
  TextInput,
  TextArea,
  Button,
  ProgressBar,
  InlineNotification,
  Tile,
} from "@carbon/react";
import { Upload } from "@carbon/icons-react";
import Navigation from "@/components/Navigation";
import VideoDropzone from "@/components/VideoDropzone";
import TagInput from "@/components/TagInput";
import { PageLayout } from "@/components/PageLayout";
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

  useEffect(() => {
    if (!file) { setMeta({ width: null, height: null, duration: null, size: null }); return; }
    setMeta({ width: null, height: null, duration: null, size: file.size });
    const url = URL.createObjectURL(file);
    const vid = document.createElement("video");
    vid.preload = "metadata";
    vid.onloadedmetadata = () => {
      setMeta({ width: vid.videoWidth || null, height: vid.videoHeight || null, duration: isFinite(vid.duration) ? vid.duration : null, size: file.size });
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
    } catch { /* error set by hook */ }
  };

  return (
    <>
      <Navigation />
      <PageLayout maxWidth="md">
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 className="cds--type-productive-heading-04">Upload New Video</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)", marginTop: "0.25rem" }}>
            Add a video to the shared library with metadata.
          </p>
        </div>

        <Form onSubmit={handleSubmit}>
          {/* Dropzone + auto-detected metadata */}
          <Tile style={{ marginBottom: "1rem" }}>
            <VideoDropzone onFileSelected={setFile} selectedFile={file} />

            {file && (
              <dl
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "1rem",
                  marginTop: "1rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid var(--cds-border-subtle-01)",
                }}
              >
                <div>
                  <dt style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>Resolution</dt>
                  <dd style={{ fontSize: "0.875rem", fontWeight: 500, marginTop: "0.25rem" }}>
                    {meta.width && meta.height ? formatResolution(meta.width, meta.height) : "-"}
                  </dd>
                </div>
                <div>
                  <dt style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>Duration</dt>
                  <dd style={{ fontSize: "0.875rem", fontWeight: 500, marginTop: "0.25rem" }}>
                    {meta.duration != null ? formatDuration(meta.duration) : "-"}
                  </dd>
                </div>
                <div>
                  <dt style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>File Size</dt>
                  <dd style={{ fontSize: "0.875rem", fontWeight: 500, marginTop: "0.25rem" }}>
                    {meta.size != null ? formatFileSize(meta.size) : "-"}
                  </dd>
                </div>
              </dl>
            )}
          </Tile>

          {/* Metadata */}
          <Tile style={{ marginBottom: "1rem" }}>
            <TextInput
              id="upload-title"
              labelText="Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My Reel #1"
              maxCount={255}
              required
              style={{ marginBottom: "1rem" }}
            />
            <TextArea
              id="upload-description"
              labelText="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              maxCount={1000}
              rows={3}
              style={{ marginBottom: "1rem" }}
            />
            <TagInput selectedIds={tagIds} onChange={setTagIds} />
          </Tile>

          {/* Progress */}
          {uploading && (
            <div style={{ marginBottom: "1rem" }}>
              <ProgressBar
                label="Uploading video"
                value={progress}
                max={100}
                status="active"
              />
            </div>
          )}

          {/* Errors */}
          {(formError || error) && (
            <InlineNotification
              kind="error"
              title={formError ?? error ?? "Upload failed"}
              style={{ marginBottom: "1rem" }}
            />
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <Button kind="secondary" type="button" disabled={uploading} onClick={() => router.push("/video")}>
              Cancel
            </Button>
            <Button kind="primary" type="submit" disabled={uploading || !file} renderIcon={Upload}>
              {uploading ? `Uploading ${progress}%...` : "Upload Video"}
            </Button>
          </div>
        </Form>
      </PageLayout>
    </>
  );
}
