"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { PageLayout } from "@/components/PageLayout";
import { Button, InlineNotification } from "@carbon/react";
import SegmentedToggle from "@/components/SegmentedToggle";
import ScriptSections from "@/components/ScriptSections";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Script } from "@/lib/types";

interface Props {
  params: { id: string };
}

type ExportFormat = "txt" | "md" | "pdf";

export default function ScriptDetailPage({ params }: Props) {
  const { id } = params;
  const searchParams = useSearchParams();

  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "edit">(
    searchParams.get("mode") === "edit" ? "edit" : "view"
  );
  const [edits, setEdits] = useState<Partial<Script>>({});
  const [saving, setSaving] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Script>(`/scripts/${id}`)
      .then((res) => { setScript(res.data); setEdits({}); })
      .catch(() => setError("Script not found or you don't have access."))
      .finally(() => setLoading(false));
  }, [id]);

  const displayScript = script ? { ...script, ...edits } as Script : null;

  const handleChange = (key: keyof Script, value: string) => {
    setEdits((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!script) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await api.put<Script>(`/scripts/${id}`, edits);
      setScript(res.data);
      setEdits({});
      setMode("view");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setSaveError(msg || "Failed to save script. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (fmt: ExportFormat) => {
    setExporting(fmt);
    setExportError(null);
    try {
      const res = await api.get(`/scripts/${id}/export`, {
        params: { format: fmt },
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `script-${id}.${fmt}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Export failed. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  const handleCopy = async () => {
    if (!displayScript) return;
    const text = [
      `TITLE: ${displayScript.title}`,
      displayScript.hook_opening ? `\n--- HOOK / OPENING ---\n${displayScript.hook_opening}` : "",
      displayScript.scenes ? `\n--- SCENES ---\n${displayScript.scenes}` : "",
      displayScript.broll_suggestions ? `\n--- B-ROLL ---\n${displayScript.broll_suggestions}` : "",
      displayScript.caption_suggestion ? `\n--- CAPTION ---\n${displayScript.caption_suggestion}` : "",
      displayScript.cta_ending ? `\n--- CTA ---\n${displayScript.cta_ending}` : "",
      displayScript.hashtags ? `\n--- HASHTAGS ---\n${displayScript.hashtags}` : "",
    ].filter(Boolean).join("\n");

    await navigator.clipboard.writeText(text);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <PageLayout maxWidth="md">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "16rem" }}>
            <p style={{ color: "var(--cds-text-secondary)", fontSize: "0.875rem" }}>Loading…</p>
          </div>
        </PageLayout>
      </>
    );
  }

  if (error || !displayScript) {
    return (
      <>
        <Navigation />
        <PageLayout maxWidth="md">
          <InlineNotification kind="error" title={error ?? "Script not found."} />
          <Link href="/script/scripts" style={{ marginTop: "1rem", display: "inline-block", fontSize: "0.875rem", color: "#0f62fe" }}>
            ← Back to Scripts
          </Link>
        </PageLayout>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <PageLayout maxWidth="md">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <Link href="/script/scripts" style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)", whiteSpace: "nowrap" }}>
              ← Scripts
            </Link>
            <span style={{ color: "#c6c6c6" }}>/</span>
            <h1 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--cds-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "20rem" }}>
              {displayScript.title}
            </h1>
            {displayScript.is_ai_generated && (
              <span style={{ fontSize: "0.75rem", backgroundColor: "#f0e6ff", color: "#6929c4", padding: "2px 6px", borderRadius: "4px", fontWeight: 500, whiteSpace: "nowrap" }}>AI</span>
            )}
          </div>
          <SegmentedToggle value={mode} onChange={(m) => { setMode(m); if (m === "view") setEdits({}); }} />
        </div>

        {/* Source ideation link */}
        {displayScript.ideation_title && (
          <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)", marginBottom: "1.25rem" }}>
            From ideation:{" "}
            <Link href={`/script/ideation/${displayScript.ideation_id}`} style={{ color: "#0f62fe" }}>
              {displayScript.ideation_title}
            </Link>
          </p>
        )}

        {/* Export bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)", fontWeight: 500 }}>Export:</span>
          {(["txt", "md", "pdf"] as ExportFormat[]).map((fmt) => (
            <Button key={fmt} kind="ghost" size="sm" onClick={() => handleExport(fmt)} disabled={exporting !== null}>
              {exporting === fmt ? "…" : fmt.toUpperCase()}
            </Button>
          ))}
          <Button kind="ghost" size="sm" onClick={handleCopy}>
            {copyDone ? "✓ Copied!" : "Copy"}
          </Button>
        </div>

        {/* Error banners */}
        {exportError && (
          <InlineNotification
            kind="error"
            title={exportError}
            onCloseButtonClick={() => setExportError(null)}
            style={{ marginBottom: "1rem" }}
          />
        )}
        {saveError && (
          <InlineNotification
            kind="error"
            title={saveError}
            onCloseButtonClick={() => setSaveError(null)}
            style={{ marginBottom: "1rem" }}
          />
        )}

        {/* Script content */}
        <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
          {mode === "edit" ? (
            <>
              <ScriptSections mode="edit" script={displayScript} onChange={handleChange} />
              <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <Button kind="ghost" size="sm" onClick={() => { setEdits({}); setMode("view"); setSaveError(null); }}>
                  Cancel
                </Button>
                <Button kind="primary" size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </>
          ) : (
            <ScriptSections mode="view" script={displayScript} />
          )}
        </div>

        {/* Footer meta */}
        <div style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--cds-text-secondary)", display: "flex", flexDirection: "column", gap: "2px" }}>
          <p>Created: {new Date(displayScript.created_at).toLocaleString()}</p>
          {displayScript.updated_by_name && <p>Last edited by: {displayScript.updated_by_name}</p>}
        </div>
      </PageLayout>
    </>
  );
}
