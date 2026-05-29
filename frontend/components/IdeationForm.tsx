"use client";

import { useState } from "react";
import {
  Form,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  Button,
  InlineNotification,
} from "@carbon/react";
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

const gap = { marginBottom: "1rem" };
const twoCol = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" };

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

  return (
    <Form onSubmit={handleSubmit}>
      {error && (
        <InlineNotification kind="error" title={error} style={{ marginBottom: "1.5rem" }} />
      )}

      <TextInput
        id="ideation-title"
        labelText="Title *"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        placeholder="e.g. 5 tips for growing on Instagram"
        required
        disabled={loading}
        style={gap}
      />

      <div style={twoCol}>
        <Select id="ideation-platform" labelText="Platform" value={form.platform}
          onChange={(e) => set("platform", e.target.value)} disabled={loading}>
          <SelectItem value="" text="Select platform..." />
          {PLATFORMS.map((p) => <SelectItem key={p} value={p} text={p} />)}
        </Select>
        <Select id="ideation-frequency" labelText="Posting Frequency" value={form.posting_frequency}
          onChange={(e) => set("posting_frequency", e.target.value)} disabled={loading}>
          <SelectItem value="" text="Select frequency..." />
          {FREQUENCIES.map((f) => <SelectItem key={f} value={f} text={f} />)}
        </Select>
      </div>

      <div style={twoCol}>
        <TextInput id="ideation-niche" labelText="Niche" value={form.niche}
          onChange={(e) => set("niche", e.target.value)}
          placeholder="e.g. Fitness, Travel, Food" disabled={loading} />
        <Select id="ideation-tone" labelText="Tone / Style" value={form.tone_style}
          onChange={(e) => set("tone_style", e.target.value)} disabled={loading}>
          <SelectItem value="" text="Select tone..." />
          {TONES.map((t) => <SelectItem key={t} value={t} text={t} />)}
        </Select>
      </div>

      <TextInput id="ideation-audience" labelText="Target Audience" value={form.target_audience}
        onChange={(e) => set("target_audience", e.target.value)}
        placeholder="e.g. Women 25-35, fitness enthusiasts" disabled={loading} style={gap} />

      <TextArea id="ideation-hook" labelText="Hook" value={form.hook}
        onChange={(e) => set("hook", e.target.value)}
        placeholder="Opening hook to grab attention..." rows={2} disabled={loading} style={gap} />

      <TextArea id="ideation-summary" labelText="Content Summary" value={form.content_summary}
        onChange={(e) => set("content_summary", e.target.value)}
        placeholder="What the video covers..." rows={3} disabled={loading} style={gap} />

      <TextInput id="ideation-cta" labelText="Call To Action" value={form.cta}
        onChange={(e) => set("cta", e.target.value)}
        placeholder="e.g. Save this for later, Follow for more!" disabled={loading} style={gap} />

      <div style={twoCol}>
        <TextInput id="ideation-upload-date" labelText="Upload Date" type="date"
          value={form.upload_date} onChange={(e) => set("upload_date", e.target.value)} />
        <TextInput id="ideation-upload-time" labelText="Upload Time" type="time"
          value={form.upload_time} onChange={(e) => set("upload_time", e.target.value)} />
      </div>

      <Select id="ideation-status" labelText="Status" value={form.status}
        onChange={(e) => set("status", e.target.value as IdeationStatus)} disabled={loading} style={gap}>
        {STATUSES.map((s) => <SelectItem key={s} value={s} text={s} />)}
      </Select>

      <div style={gap}>
        <TagInput selectedIds={form.tag_ids} onChange={(ids) => set("tag_ids", ids)} />
      </div>

      <TextArea id="ideation-notes" labelText="Notes" value={form.notes}
        onChange={(e) => set("notes", e.target.value)}
        placeholder="Optional notes..." rows={2} disabled={loading} style={gap} />

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
        <Button type="submit" kind="primary" disabled={loading}>
          {loading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </Form>
  );
}
