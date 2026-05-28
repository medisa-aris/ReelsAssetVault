"use client";

import { useState } from "react";

const PLATFORMS = ["Instagram", "TikTok", "YouTube Shorts", "Facebook Reels", "Pinterest"];
const FREQUENCIES = ["Daily", "3x per week", "2x per week", "Weekly", "Bi-weekly"];
const TONES = ["Casual", "Educational", "Inspirational", "Humorous", "Professional", "Trendy"];

export interface AIGeneratorFormData {
  niche: string;
  target_audience: string;
  platform: string;
  posting_frequency: string;
  tone_style: string;
  week_starting: string;
}

interface AIGeneratorFormProps {
  onSubmit: (data: AIGeneratorFormData) => Promise<void>;
  loading?: boolean;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function AIGeneratorForm({ onSubmit, loading }: AIGeneratorFormProps) {
  const [form, setForm] = useState<AIGeneratorFormData>({
    niche: "",
    target_audience: "",
    platform: "Instagram",
    posting_frequency: "3x per week",
    tone_style: "Casual",
    week_starting: todayStr(),
  });
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof AIGeneratorFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.niche.trim()) { setError("Niche is required"); return; }
    setError(null);
    try {
      await onSubmit(form);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "AI generation failed. Please check your AI config and try again.");
    }
  };

  const fieldClass = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {/* Niche */}
      <div>
        <label className={labelClass}>Niche <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={form.niche}
          onChange={(e) => set("niche", e.target.value)}
          placeholder="e.g. Fitness & Wellness, Personal Finance, Food & Cooking"
          className={fieldClass}
          required
        />
      </div>

      {/* Target audience */}
      <div>
        <label className={labelClass}>Target Audience</label>
        <input
          type="text"
          value={form.target_audience}
          onChange={(e) => set("target_audience", e.target.value)}
          placeholder="e.g. Women 25-35 who want to get healthier"
          className={fieldClass}
        />
      </div>

      {/* Row: platform + frequency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Platform</label>
          <select value={form.platform} onChange={(e) => set("platform", e.target.value)} className={fieldClass}>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Posting Frequency</label>
          <select value={form.posting_frequency} onChange={(e) => set("posting_frequency", e.target.value)} className={fieldClass}>
            {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {/* Row: tone + week starting */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Tone / Style</label>
          <select value={form.tone_style} onChange={(e) => set("tone_style", e.target.value)} className={fieldClass}>
            {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Week Starting</label>
          <input type="date" value={form.week_starting} onChange={(e) => set("week_starting", e.target.value)} className={fieldClass} />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Generating 7 ideas…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate 7-Day Content Plan
          </>
        )}
      </button>
    </form>
  );
}
