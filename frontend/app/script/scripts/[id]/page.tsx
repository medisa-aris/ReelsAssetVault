"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
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
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !displayScript) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-3xl mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <p className="text-red-700">{error ?? "Script not found."}</p>
            <Link href="/script/scripts" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
              ← Back to Scripts
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-3xl mx-auto px-6 py-8">
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
            <button
              key={fmt}
              onClick={() => handleExport(fmt)}
              disabled={exporting !== null}
              className="text-xs px-2.5 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors uppercase"
            >
              {exporting === fmt ? "…" : fmt}
            </button>
          ))}
          <button
            onClick={handleCopy}
            className="ml-2 text-xs px-2.5 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {copyDone ? "✓ Copied!" : "Copy"}
          </button>
        </div>

        {/* Error banners */}
        {exportError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm flex justify-between">
            <span>{exportError}</span>
            <button onClick={() => setExportError(null)} className="ml-4 font-bold">×</button>
          </div>
        )}
        {saveError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm flex justify-between">
            <span>{saveError}</span>
            <button onClick={() => setSaveError(null)} className="ml-4 font-bold">×</button>
          </div>
        )}

        {/* Script content */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {mode === "edit" ? (
            <>
              <ScriptSections mode="edit" script={displayScript} onChange={handleChange} />
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => { setEdits({}); setMode("view"); setSaveError(null); }}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
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
      </main>
    </div>
  );
}
