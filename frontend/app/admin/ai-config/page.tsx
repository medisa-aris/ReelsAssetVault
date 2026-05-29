"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { PageLayout } from "@/components/PageLayout";
import { useNotification } from "@/components/NotificationProvider";
import { Button, InlineNotification, Tile } from "@carbon/react";
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
    <Tile style={{ borderLeft: config.is_active ? "3px solid var(--cds-interactive)" : undefined }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">{PROVIDER_LABELS[config.provider] ?? config.provider}</h2>
            {config.is_active && (
              <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                Active
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">{config.provider}</p>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Current values (read mode) */}
      {!editing && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-xs text-gray-400 font-medium">Model</dt>
            <dd className="text-gray-700 font-mono text-xs mt-0.5">{config.model ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 font-medium">API Key</dt>
            <dd className="text-gray-700 font-mono text-xs mt-0.5">
              {config.api_key ? config.api_key : <span className="italic text-gray-400">not set</span>}
            </dd>
          </div>
          {showBaseUrl && (
            <div className="col-span-2">
              <dt className="text-xs text-gray-400 font-medium">Base URL</dt>
              <dd className="text-gray-700 font-mono text-xs mt-0.5">{config.base_url ?? "—"}</dd>
            </div>
          )}
        </dl>
      )}

      {/* Edit form */}
      {editing && (
        <div className="space-y-3 border-t border-gray-100 pt-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={config.api_key ? "Leave blank to keep current" : "Enter API key…"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {showBaseUrl && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Base URL</label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
          <div className="flex justify-end">
            <Button kind="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}

      {/* Test result */}
      {testResult && (
        <div className={`mt-3 rounded-lg px-3 py-2 text-xs ${testResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
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
    setConfigs((prev) =>
      prev.map((c) => ({ ...c, is_active: c.id === activeId }))
    );
  };

  return (
    <>
      <Navigation />
      <PageLayout maxWidth="md">
        <div className="mb-6">
          <h1 className="cds--type-productive-heading-04">AI Configuration</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure which AI provider is used for content generation. Only one provider can be active at a time.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <InlineNotification kind="error" title={error} />
        ) : (
          <div className="space-y-4">
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
