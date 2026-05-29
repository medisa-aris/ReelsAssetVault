"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { PageLayout } from "@/components/PageLayout";
import { useNotification } from "@/components/NotificationProvider";
import {
  Button,
  InlineNotification,
  Tile,
  TextInput,
  PasswordInput,
  Select,
  SelectItem,
} from "@carbon/react";
import { api } from "@/lib/api";
import type { AiConfig } from "@/lib/types";

const PROVIDER_LABELS: Record<string, string> = {
  claude: "Claude (Anthropic)",
  chatgpt: "ChatGPT (OpenAI)",
  ollama: "Ollama (Local)",
  kimi: "Kimi (Moonshot AI)",
};

const PROVIDER_MODELS: Record<string, string[]> = {
  claude: ["claude-opus-4-5", "claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
  chatgpt: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
  ollama: ["llama3.2", "llama3.1", "mistral", "phi3"],
  kimi: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
};

interface ConfigCardProps {
  config: AiConfig;
  onUpdate: (updated: AiConfig) => void;
  onActivate: (id: string) => void;
}

function ConfigCard({ config, onUpdate, onActivate }: ConfigCardProps) {
  const { notify } = useNotification();
  const [editing, setEditing] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(config.model ?? "");
  const [baseUrl, setBaseUrl] = useState(config.base_url ?? "");
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string> = { model, base_url: baseUrl };
      if (apiKey) payload.api_key = apiKey;
      const res = await api.put<AiConfig>(`/admin/ai-config/${config.id}`, payload);
      onUpdate(res.data);
      setApiKey("");
      setEditing(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      notify("error", "Save Failed", msg || "Failed to save config.");
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    setActivating(true);
    try {
      await api.patch(`/admin/ai-config/${config.id}/activate`);
      onActivate(config.id);
    } catch {
      notify("error", "Activation Failed", "Failed to activate provider.");
    } finally {
      setActivating(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.post<{ success: boolean; message: string }>("/admin/ai-config/test", {
        provider: config.provider,
      });
      setTestResult(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setTestResult({ success: false, message: msg || "Connection test failed." });
    } finally {
      setTesting(false);
    }
  };

  const models = PROVIDER_MODELS[config.provider] ?? [];
  const showBaseUrl = config.provider === "ollama" || config.provider === "kimi";

  return (
    <Tile style={{
      borderLeft: config.is_active ? "3px solid var(--cds-interactive)" : undefined,
      backgroundColor: editing ? "#ffffff" : undefined,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h2 style={{ fontWeight: 600, fontSize: "1rem", color: "var(--cds-text-primary)" }}>
              {PROVIDER_LABELS[config.provider] ?? config.provider}
            </h2>
            {config.is_active && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                fontSize: "0.75rem", backgroundColor: "#defbe6", color: "#0e6027",
                padding: "2px 8px", borderRadius: "9999px", fontWeight: 500,
              }}>
                <span style={{ width: "6px", height: "6px", backgroundColor: "#24a148", borderRadius: "50%", display: "inline-block" }} />
                Active
              </span>
            )}
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)", marginTop: "2px", fontFamily: "monospace" }}>
            {config.provider}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {!config.is_active && (
            <Button kind="primary" size="sm" onClick={handleActivate} disabled={activating}>
              {activating ? "Activating…" : "Set Active"}
            </Button>
          )}
          <Button
            kind="ghost"
            size="sm"
            onClick={handleTest}
            disabled={testing || !config.is_active}
            title={!config.is_active ? "Activate this provider first to test" : ""}
          >
            {testing ? "Testing…" : "Test"}
          </Button>
          <Button kind="ghost" size="sm" onClick={() => setEditing((v) => !v)}>
            {editing ? "Cancel" : "Edit"}
          </Button>
        </div>
      </div>

      {/* Read mode */}
      {!editing && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
          <div>
            <dt style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)", fontWeight: 500 }}>Model</dt>
            <dd style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--cds-text-primary)", marginTop: "2px" }}>
              {config.model ?? "—"}
            </dd>
          </div>
          <div>
            <dt style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)", fontWeight: 500 }}>API Key</dt>
            <dd style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--cds-text-primary)", marginTop: "2px" }}>
              {config.api_key ? config.api_key : <span style={{ fontStyle: "italic", color: "var(--cds-text-secondary)" }}>not set</span>}
            </dd>
          </div>
          {showBaseUrl && (
            <div style={{ gridColumn: "1 / -1" }}>
              <dt style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)", fontWeight: 500 }}>Base URL</dt>
              <dd style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--cds-text-primary)", marginTop: "2px" }}>
                {config.base_url ?? "—"}
              </dd>
            </div>
          )}
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div style={{ borderTop: "1px solid var(--cds-border-subtle)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <PasswordInput
            id={`api-key-${config.id}`}
            labelText="API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={config.api_key ? "Leave blank to keep current" : "Enter API key…"}
          />
          <Select
            id={`model-${config.id}`}
            labelText="Model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {models.map((m) => <SelectItem key={m} value={m} text={m} />)}
          </Select>
          {showBaseUrl && (
            <TextInput
              id={`base-url-${config.id}`}
              labelText="Base URL"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
            />
          )}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button kind="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}

      {/* Test result */}
      {testResult && (
        <div style={{
          marginTop: "12px", borderRadius: "8px", padding: "8px 12px", fontSize: "0.75rem",
          backgroundColor: testResult.success ? "#defbe6" : "#fff1f1",
          color: testResult.success ? "#0e6027" : "#da1e28",
        }}>
          {testResult.success ? "✓ " : "✗ "}{testResult.message}
        </div>
      )}
    </Tile>
  );
}

export default function AiConfigPage() {
  const [configs, setConfigs] = useState<AiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<AiConfig[]>("/admin/ai-config")
      .then((res) => setConfigs(res.data))
      .catch((err) => {
        const msg = err.response?.data?.detail;
        setError(msg || "Failed to load AI config. Admin access required.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = (updated: AiConfig) => {
    setConfigs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleActivate = (activeId: string) => {
    setConfigs((prev) => prev.map((c) => ({ ...c, is_active: c.id === activeId })));
  };

  return (
    <>
      <Navigation />
      <PageLayout maxWidth="md">
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 className="cds--type-productive-heading-04">AI Configuration</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)", marginTop: "0.25rem" }}>
            Configure which AI provider is used for content generation. Only one provider can be active at a time.
          </p>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "12rem" }}>
            <p style={{ color: "var(--cds-text-secondary)", fontSize: "0.875rem" }}>Loading…</p>
          </div>
        ) : error ? (
          <InlineNotification kind="error" title={error} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {configs.map((config) => (
              <ConfigCard
                key={config.id}
                config={config}
                onUpdate={handleUpdate}
                onActivate={handleActivate}
              />
            ))}
          </div>
        )}
      </PageLayout>
    </>
  );
}
