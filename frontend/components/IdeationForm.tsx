"use client";

import { useState } from "react";
import TagInput from "@/components/TagInput";
import type { Ideation, IdeationStatus } from "@/lib/types";

const PLATFORMS = ["Instagram", "TikTok", "YouTube Shorts", "Facebook Reels", "Pinterest"];
const FREQUENCIES = ["Daily", "3x per week", "2x per week", "Weekly", "Bi-weekly"];
const TONES = ["Casual", "Educational", "Inspirational", "Humorous", "Professional", "Trendy"];
const STATUSES: IdeationStatus[] = ["Draft", "Approved", "Script Generated", "Published"];

export interface IdeationFormData {
  title: string;
  niche: string;
  target_audience: string;
  platform: string;
  posting_frequency: string;
  tone_style: string;
  hook: string;
  content_summary: string;
  cta: string;
  upload_date: string;
  upload_time: string;
  status: IdeationStatus;
  notes: string;
  tag_ids: string[];
}

interface IdeationFormProps {
  initial?: Partial<Ideation>;
  onSubmit: (data: IdeationFormData) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
}

function toFormData(ideation?: Partial<Ideation>): IdeationFormData {
  return {
    title: ideation?.title ?? "",
    niche: ideation?.niche ?? "",
    target_audience: ideation?.target_audience ?? "",
    platform: ideation?.platform ?? "",
    posting_frequency: ideation?.posting_frequency ?? "",
    tone_style: ideation?.tone_style ?? "",
    hook: ideation?.hook ?? "",
    content_summary: ideation?.content_summary ?? "",
    cta: ideation?.cta ?? "",
    upload_date: ideation?.upload_date ?? "",
    upload_time: ideation?.upload_time ?? "",
    status: ideation?.status ?? "Draft",
    notes: ideation?.notes ?? "",
    tag_ids: ideation?.tags?.map((t) => t.id) ?? [],
  };
}

export default function IdeationForm({ initial, onSubmit, submitLabel = "Save", loading }: IdeationFormProps) {
  const [form, setForm] = useState<IdeationFormData>(toFormData(initial));
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof IdeationFormData, value: string | string[]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    setError(null);
    try {
      await onSubmit(form);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "An error occurred. Please try again.");
    }
  };

  const fieldClass = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {/* Title */}
      <div>
        <label className={labelClass}>Title <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. 5 tips for growing on Instagram"
          className={fieldClass}
          required
        />
      </div>

      {/* Row: platform + frequency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Platform</label>
          <select value={form.platform} onChange={(e) => set("platform", e.target.value)} className={fieldClass}>
            <option value="">Select platform…</option>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Posting Frequency</label>
          <select value={form.posting_frequency} onChange={(e) => set("posting_frequency", e.target.value)} className={fieldClass}>
            <option value="">Select frequency…</option>
            {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {/* Row: niche + tone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Niche</label>
          <input
            type="text"
            value={form.niche}
            onChange={(e) => set("niche", e.target.value)}
            placeholder="e.g. Fitness, Travel, Food"
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass}>Tone / Style</label>
          <select value={form.tone_style} onChange={(e) => set("tone_style", e.target.value)} className={fieldClass}>
            <option value="">Select tone…</option>
            {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Target audience */}
      <div>
        <label className={labelClass}>Target Audience</label>
        <input
          type="text"
          value={form.target_audience}
          onChange={(e) => set("target_audience", e.target.value)}
          placeholder="e.g. Women 25-35, fitness enthusiasts"
          className={fieldClass}
        />
      </div>

      {/* Hook */}
      <div>
        <label className={labelClass}>Hook</label>
        <textarea
          value={form.hook}
          onChange={(e) => set("hook", e.target.value)}
          rows={2}
          placeholder="Opening hook to grab attention…"
          className={fieldClass}
        />
      </div>

      {/* Content summary */}
      <div>
        <label className={labelClass}>Content Summary</label>
        <textarea
          value={form.content_summary}
          onChange={(e) => set("content_summary", e.target.value)}
          rows={3}
          placeholder="What the video covers…"
          className={fieldClass}
        />
      </div>

      {/* CTA */}
      <div>
        <label className={labelClass}>Call To Action</label>
        <input
          type="text"
          value={form.cta}
          onChange={(e) => set("cta", e.target.value)}
          placeholder="e.g. Save this for later, Follow for more!"
          className={fieldClass}
        />
      </div>

      {/* Row: upload date + time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Upload Date</label>
          <input type="date" value={form.upload_date} onChange={(e) => set("upload_date", e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>Upload Time</label>
          <input type="time" value={form.upload_time} onChange={(e) => set("upload_time", e.target.value)} className={fieldClass} />
        </div>
      </div>

      {/* Status */}
      <div>
        <label className={labelClass}>Status</label>
        <select value={form.status} onChange={(e) => set("status", e.target.value as IdeationStatus)} className={fieldClass}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className={labelClass}>Tags</label>
        <TagInput
          selectedIds={form.tag_ids}
          onChange={(ids: string[]) => set("tag_ids", ids)}
        />
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
          placeholder="Optional notes…"
          className={fieldClass}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
