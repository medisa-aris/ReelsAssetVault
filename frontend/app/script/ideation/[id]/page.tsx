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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "16rem" }}>
            <p style={{ color: "var(--cds-text-secondary)", fontSize: "0.875rem" }}>Loading…</p>
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
          <Link href="/script/ideation" style={{ marginTop: "1rem", display: "inline-block", fontSize: "0.875rem", color: "#0f62fe" }}>
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <Link href="/script/ideation" style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)", whiteSpace: "nowrap" }}>
              ← Ideation
            </Link>
            <span style={{ color: "#c6c6c6" }}>/</span>
            <h1 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--cds-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "20rem" }}>
              {ideation.title}
            </h1>
          </div>
          <SegmentedToggle value={mode} onChange={setMode} />
        </div>

        {/* Meta row */}
        {mode === "view" && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", marginBottom: "1.25rem" }}>
            <StatusBadge status={ideation.status} />
            {ideation.is_ai_generated && (
              <span style={{ fontSize: "0.75rem", backgroundColor: "#f0e6ff", color: "#6929c4", padding: "2px 8px", borderRadius: "4px", fontWeight: 500 }}>
                AI Generated
              </span>
            )}
            {ideation.platform && (
              <span style={{ fontSize: "0.75rem", backgroundColor: "#e0e0e0", color: "#525252", padding: "2px 8px", borderRadius: "4px" }}>
                {ideation.platform}
              </span>
            )}
            {ideation.upload_date && (
              <span style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>📅 {formatDate(ideation.upload_date)}</span>
            )}
            {ideation.upload_time && (
              <span style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>🕐 {ideation.upload_time}</span>
            )}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
              <LanguageToggle value={scriptLanguage} onChange={setScriptLanguage} />
              <Button kind="primary" size="sm" onClick={handleGenerateScript} disabled={generating}>
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
            style={{ marginBottom: "1rem" }}
          />
        )}

        {/* Content card */}
        <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
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
  const labelStyle: React.CSSProperties = {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--cds-text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "4px",
  };

  const valueStyle: React.CSSProperties = {
    fontSize: "0.875rem",
    color: "var(--cds-text-primary)",
    whiteSpace: "pre-wrap",
  };

  const emptyStyle: React.CSSProperties = {
    color: "var(--cds-text-placeholder)",
    fontStyle: "italic",
  };

  const field = (label: string, value: string | null | undefined) => (
    <div key={label} style={{ marginBottom: "1.25rem" }}>
      <p style={labelStyle}>{label}</p>
      <p style={valueStyle}>{value || <span style={emptyStyle}>—</span>}</p>
    </div>
  );

  return (
    <div>
      {field("Niche", ideation.niche)}
      {field("Target Audience", ideation.target_audience)}
      {field("Posting Frequency", ideation.posting_frequency)}
      {field("Tone / Style", ideation.tone_style)}
      {field("Hook", ideation.hook)}
      {field("Content Summary", ideation.content_summary)}
      {field("Call To Action", ideation.cta)}
      {field("Notes", ideation.notes)}

      {ideation.tags.length > 0 && (
        <div style={{ marginBottom: "1.25rem" }}>
          <p style={labelStyle}>Tags</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {ideation.tags.map((t) => (
              <span key={t.id} style={{ padding: "2px 10px", backgroundColor: "#e0e0e0", color: "#525252", borderRadius: "9999px", fontSize: "0.75rem" }}>
                {t.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ paddingTop: "8px", borderTop: "1px solid #e0e0e0", fontSize: "0.75rem", color: "var(--cds-text-secondary)", display: "flex", flexDirection: "column", gap: "4px" }}>
        <p>Created: {new Date(ideation.created_at).toLocaleString()}</p>
        {ideation.updated_by_name && <p>Last edited by: {ideation.updated_by_name}</p>}
      </div>
    </div>
  );
}
