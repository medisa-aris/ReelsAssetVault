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
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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
          <Link href="/script/scripts" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/script/scripts" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              ← Scripts
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-xl font-bold text-gray-900 truncate max-w-xs">{displayScript.title}</h1>
            {displayScript.is_ai_generated && (
              <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium">AI</span>
            )}
          </div>
          <SegmentedToggle value={mode} onChange={(m) => { setMode(m); if (m === "view") setEdits({}); }} />
        </div>

        {/* Source ideation link */}
        {displayScript.ideation_title && (
          <p className="text-sm text-gray-500 mb-5">
            From ideation:{" "}
            <Link href={`/script/ideation/${displayScript.ideation_id}`} className="text-indigo-600 hover:underline">
              {displayScript.ideation_title}
            </Link>
          </p>
        )}

        {/* Export bar */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500 font-medium">Export:</span>
          {(["txt", "md", "pdf"] as ExportFormat[]).map((fmt) => (
            <Button
              key={fmt}
              kind="ghost"
              size="sm"
              onClick={() => handleExport(fmt)}
              disabled={exporting !== null}
            >
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
            className="mb-4"
          />
        )}
        {saveError && (
          <InlineNotification
            kind="error"
            title={saveError}
            onCloseButtonClick={() => setSaveError(null)}
            className="mb-4"
          />
        )}

        {/* Script content */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {mode === "edit" ? (
            <>
              <ScriptSections mode="edit" script={displayScript} onChange={handleChange} />
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  kind="ghost"
                  size="sm"
                  onClick={() => { setEdits({}); setMode("view"); setSaveError(null); }}
                >
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
        <div className="mt-4 text-xs text-gray-400 space-y-0.5">
          <p>Created: {new Date(displayScript.created_at).toLocaleString()}</p>
          {displayScript.updated_by_name && <p>Last edited by: {displayScript.updated_by_name}</p>}
        </div>
      </PageLayout>
    </>
  );
}
