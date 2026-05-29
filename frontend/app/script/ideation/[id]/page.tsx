"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { PageLayout } from "@/components/PageLayout";
import { Button, InlineNotification } from "@carbon/react";
import SegmentedToggle from "@/components/SegmentedToggle";
import StatusBadge from "@/components/StatusBadge";
import LanguageToggle, { type Language } from "@/components/LanguageToggle";
import IdeationForm, { type IdeationFormData } from "@/components/IdeationForm";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Ideation, Script } from "@/lib/types";

interface Props {
  params: { id: string };
}

export default function IdeationDetailPage({ params }: Props) {
  const { id } = params;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [ideation, setIdeation] = useState<Ideation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "edit">(
    searchParams.get("mode") === "edit" ? "edit" : "view"
  );
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [scriptLanguage, setScriptLanguage] = useState<Language>("en");

  useEffect(() => {
    api
      .get<Ideation>(`/ideations/${id}`)
      .then((res) => setIdeation(res.data))
      .catch(() => setError("Ideation not found or you don't have access."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (data: IdeationFormData) => {
    setSaving(true);
    try {
      const res = await api.put<Ideation>(`/ideations/${id}`, data);
      setIdeation(res.data);
      setMode("view");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateScript = async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await api.post<Script>("/scripts/generate", { ideation_id: id, language: scriptLanguage });
      router.push(`/script/scripts/${res.data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setGenerateError(msg || "Script generation failed. Check AI Config in Admin.");
    } finally {
      setGenerating(false);
    }
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

  if (error || !ideation) {
    return (
      <>
        <Navigation />
        <PageLayout maxWidth="md">
          <InlineNotification kind="error" title={error ?? "Ideation not found."} />
          <Link href="/script/ideation" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
            ← Back to Ideation
          </Link>
        </PageLayout>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <PageLayout maxWidth="md">
        {/* Breadcrumb + toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/script/ideation" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              ← Ideation
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-xl font-bold text-gray-900 truncate max-w-xs">{ideation.title}</h1>
          </div>
          <SegmentedToggle value={mode} onChange={setMode} />
        </div>

        {/* Meta row */}
        {mode === "view" && (
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <StatusBadge status={ideation.status} />
            {ideation.is_ai_generated && (
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded font-medium">AI Generated</span>
            )}
            {ideation.platform && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{ideation.platform}</span>
            )}
            {ideation.upload_date && (
              <span className="text-xs text-gray-500">📅 {formatDate(ideation.upload_date)}</span>
            )}
            {ideation.upload_time && (
              <span className="text-xs text-gray-500">🕐 {ideation.upload_time}</span>
            )}
            <div className="ml-auto flex items-center gap-2">
              <LanguageToggle value={scriptLanguage} onChange={setScriptLanguage} />
              <Button
                kind="primary"
                size="sm"
                onClick={handleGenerateScript}
                disabled={generating}
              >
                {generating ? "Generating…" : "Generate Script"}
              </Button>
            </div>
          </div>
        )}

        {/* Generate error */}
        {generateError && (
          <InlineNotification
            kind="error"
            title={generateError}
            onCloseButtonClick={() => setGenerateError(null)}
            className="mb-4"
          />
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {mode === "edit" ? (
            <IdeationForm initial={ideation} onSubmit={handleSave} submitLabel="Save Changes" loading={saving} />
          ) : (
            <IdeationViewFields ideation={ideation} />
          )}
        </div>
      </PageLayout>
    </>
  );
}

function IdeationViewFields({ ideation }: { ideation: Ideation }) {
  const field = (label: string, value: string | null | undefined) => (
    <div key={label}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-gray-800 whitespace-pre-wrap">{value || <span className="text-gray-400 italic">—</span>}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {field("Niche", ideation.niche)}
      {field("Target Audience", ideation.target_audience)}
      {field("Posting Frequency", ideation.posting_frequency)}
      {field("Tone / Style", ideation.tone_style)}
      {field("Hook", ideation.hook)}
      {field("Content Summary", ideation.content_summary)}
      {field("Call To Action", ideation.cta)}
      {field("Notes", ideation.notes)}

      {ideation.tags.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {ideation.tags.map((t) => (
              <span key={t.id} className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{t.name}</span>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-gray-100 text-xs text-gray-400 space-y-1">
        <p>Created: {new Date(ideation.created_at).toLocaleString()}</p>
        {ideation.updated_by_name && <p>Last edited by: {ideation.updated_by_name}</p>}
      </div>
    </div>
  );
}
