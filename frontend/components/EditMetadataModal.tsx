"use client";

import { useState } from "react";
import {
  ComposedModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  TextInput,
  TextArea,
  Button,
  InlineNotification,
} from "@carbon/react";
import { api } from "@/lib/api";
import TagInput from "@/components/TagInput";
import { formatDuration, formatFileSize, formatResolution } from "@/lib/utils";
import type { Asset } from "@/lib/types";

interface EditMetadataModalProps {
  asset: Asset;
  onClose: () => void;
  onSaved: (updated: Asset) => void;
}

export default function EditMetadataModal({ asset, onClose, onSaved }: EditMetadataModalProps) {
  const [title, setTitle] = useState(asset.title);
  const [description, setDescription] = useState(asset.description ?? "");
  const [tagIds, setTagIds] = useState<string[]>(asset.tags.map((t) => t.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await api.put<Asset>(`/assets/${asset.id}`, {
        title: title.trim(),
        description: description || null,
        tag_ids: tagIds,
      });
      onSaved(res.data);
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          "Failed to save changes"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ComposedModal open onClose={onClose}>
      <ModalHeader title="Edit Metadata" />
      <ModalBody>
        {/* Read-only asset info */}
        <dl
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.25rem 1.5rem",
            marginBottom: "1.5rem",
            fontSize: "0.75rem",
            color: "var(--cds-text-secondary)",
            background: "var(--cds-layer-01)",
            padding: "0.75rem",
            borderRadius: "4px",
          }}
        >
          {asset.width && asset.height && (
            <div><dt style={{ display: "inline" }}>Resolution: </dt><dd style={{ display: "inline" }}>{formatResolution(asset.width, asset.height)}</dd></div>
          )}
          <div><dt style={{ display: "inline" }}>Size: </dt><dd style={{ display: "inline" }}>{formatFileSize(asset.file_size_bytes)}</dd></div>
          {asset.duration_seconds != null && (
            <div><dt style={{ display: "inline" }}>Duration: </dt><dd style={{ display: "inline" }}>{formatDuration(asset.duration_seconds)}</dd></div>
          )}
          <div><dt style={{ display: "inline" }}>Uploaded: </dt><dd style={{ display: "inline" }}>{asset.created_at.slice(0, 10)}</dd></div>
        </dl>

        <TextInput
          id="edit-title"
          labelText="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxCount={255}
          required
          invalid={!!error && !title.trim()}
          invalidText="Title is required"
          style={{ marginBottom: "1rem" }}
        />

        <TextArea
          id="edit-description"
          labelText="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxCount={1000}
          rows={3}
          style={{ marginBottom: "1rem" }}
        />

        <div style={{ marginBottom: "0.5rem" }}>
          <TagInput selectedIds={tagIds} onChange={setTagIds} />
        </div>

        {error && (
          <InlineNotification
            kind="error"
            title={error}
            style={{ marginTop: "1rem" }}
          />
        )}
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button kind="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </ModalFooter>
    </ComposedModal>
  );
}
