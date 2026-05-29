"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { PageLayout } from "@/components/PageLayout";
import { Button, InlineNotification, TextInput, TextArea } from "@carbon/react";
import { api } from "@/lib/api";
import { Asset, Ideation, Script } from "@/lib/types";
import { storageUrl } from "@/lib/utils";
import AssetPickerModal from "@/components/AssetPickerModal";
import IdeationPickerModal from "@/components/IdeationPickerModal";
import ScriptPickerModal from "@/components/ScriptPickerModal";

const selectedItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flex: 1,
  backgroundColor: "#f4f4f4",
  border: "1px solid #e0e0e0",
  borderRadius: "8px",
  padding: "8px 12px",
};

const dismissBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#8d8d8d",
  fontSize: "1.25rem",
  lineHeight: 1,
  padding: 0,
};

const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: 500,
  color: "#525252",
  marginBottom: "8px",
};

export default function CreateSchedulePage() {
  const router = useRouter();

  const [assetModal, setAssetModal] = useState(false);
  const [ideationModal, setIdeationModal] = useState(false);
  const [scriptModal, setScriptModal] = useState(false);

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedIdeation, setSelectedIdeation] = useState<Ideation | null>(null);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];
  const [scheduledDate, setScheduledDate] = useState(todayStr);
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectScript = (script: Script) => {
    setSelectedScript(script);
    if (script.caption_suggestion) setCaption(script.caption_suggestion);
    if (script.hashtags) setHashtags(script.hashtags);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await api.post("/production/schedules", {
        asset_id: selectedAsset?.id ?? null,
        ideation_id: selectedIdeation?.id ?? null,
        script_id: selectedScript?.id ?? null,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        caption: caption || null,
        hashtags: hashtags || null,
        notes: notes || null,
      });
      router.push(`/production/schedule/${res.data.id}`);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to create schedule");
      setSaving(false);
    }
  };

  return (
    <>
      <Navigation />
      <PageLayout maxWidth="md">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
          <Link href="/production/schedule" style={{ color: "#8d8d8d", lineHeight: 0 }}>
            <svg style={{ width: "20px", height: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="cds--type-productive-heading-04">New Publish Schedule</h1>
        </div>

        {error && (
          <InlineNotification kind="error" title={error} style={{ marginBottom: "1rem" }} />
        )}

        <div style={{ backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Asset picker */}
          <div>
            <label style={fieldLabelStyle}>Asset (optional)</label>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {selectedAsset ? (
                <div style={selectedItemStyle}>
                  {selectedAsset.thumbnail_url && (
                    <img
                      src={storageUrl(selectedAsset.thumbnail_url) ?? ""}
                      alt={selectedAsset.title}
                      style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }}
                    />
                  )}
                  <span style={{ fontSize: "0.875rem", color: "#161616", flex: 1 }}>{selectedAsset.title}</span>
                  <button onClick={() => setSelectedAsset(null)} style={dismissBtnStyle}>&times;</button>
                </div>
              ) : (
                <Button kind="ghost" size="sm" onClick={() => setAssetModal(true)}>+ Pick Asset</Button>
              )}
            </div>
          </div>

          {/* Ideation picker */}
          <div>
            <label style={fieldLabelStyle}>Ideation (optional)</label>
            {selectedIdeation ? (
              <div style={selectedItemStyle}>
                <span style={{ fontSize: "0.875rem", color: "#161616", flex: 1 }}>{selectedIdeation.title}</span>
                <button onClick={() => setSelectedIdeation(null)} style={dismissBtnStyle}>&times;</button>
              </div>
            ) : (
              <Button kind="ghost" size="sm" onClick={() => setIdeationModal(true)}>+ Pick Ideation</Button>
            )}
          </div>

          {/* Script picker */}
          <div>
            <label style={fieldLabelStyle}>Script (optional — auto-fills caption &amp; hashtags)</label>
            {selectedScript ? (
              <div style={selectedItemStyle}>
                <span style={{ fontSize: "0.875rem", color: "#161616", flex: 1 }}>{selectedScript.title}</span>
                <button onClick={() => setSelectedScript(null)} style={dismissBtnStyle}>&times;</button>
              </div>
            ) : (
              <Button kind="ghost" size="sm" onClick={() => setScriptModal(true)}>+ Pick Script</Button>
            )}
          </div>

          {/* Date / Time */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <TextInput
              id="schedule-date"
              labelText="Scheduled Date *"
              type="date"
              value={scheduledDate}
              min={todayStr}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
            <TextInput
              id="schedule-time"
              labelText="Scheduled Time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>

          {/* Caption */}
          <TextArea
            id="schedule-caption"
            labelText="Caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            placeholder="Write your post caption..."
          />

          {/* Hashtags */}
          <TextInput
            id="schedule-hashtags"
            labelText="Hashtags"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="#reels #content #socialmedia"
          />

          {/* Notes */}
          <TextArea
            id="schedule-notes"
            labelText="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Internal notes..."
          />

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "8px", borderTop: "1px solid #e0e0e0" }}>
            <Button kind="secondary" size="sm" onClick={() => router.push("/production/schedule")}>
              Cancel
            </Button>
            <Button kind="primary" size="sm" onClick={handleSave} disabled={saving || !scheduledDate}>
              {saving ? "Saving..." : "Save as Draft"}
            </Button>
          </div>
        </div>

        {/* Modals */}
        <AssetPickerModal open={assetModal} onSelect={setSelectedAsset} onClose={() => setAssetModal(false)} />
        <IdeationPickerModal open={ideationModal} onSelect={setSelectedIdeation} onClose={() => setIdeationModal(false)} />
        <ScriptPickerModal open={scriptModal} onSelect={handleSelectScript} onClose={() => setScriptModal(false)} />
      </PageLayout>
    </>
  );
}
