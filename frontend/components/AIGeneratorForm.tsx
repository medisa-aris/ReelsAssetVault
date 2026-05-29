"use client";

import { useState } from "react";
import {
  Form,
  TextInput,
  Select,
  SelectItem,
  DatePicker,
  DatePickerInput,
  Button,
  InlineNotification,
  InlineLoading,
} from "@carbon/react";
import { Lightning } from "@carbon/icons-react";

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

  return (
    <Form onSubmit={handleSubmit}>
      {error && (
        <InlineNotification
          kind="error"
          title={error}
          style={{ marginBottom: "1.5rem" }}
        />
      )}

      <TextInput
        id="gen-niche"
        labelText="Niche / Topic *"
        value={form.niche}
        onChange={(e) => set("niche", e.target.value)}
        placeholder="e.g. Fitness & Wellness, Personal Finance, Food & Cooking"
        required
        disabled={loading}
        style={{ marginBottom: "1rem" }}
      />

      <TextInput
        id="gen-audience"
        labelText="Target Audience"
        value={form.target_audience}
        onChange={(e) => set("target_audience", e.target.value)}
        placeholder="e.g. Women 25-35 who want to get healthier"
        disabled={loading}
        style={{ marginBottom: "1rem" }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        <Select
          id="gen-platform"
          labelText="Platform"
          value={form.platform}
          onChange={(e) => set("platform", e.target.value)}
          disabled={loading}
        >
          {PLATFORMS.map((p) => <SelectItem key={p} value={p} text={p} />)}
        </Select>

        <Select
          id="gen-frequency"
          labelText="Posting Frequency"
          value={form.posting_frequency}
          onChange={(e) => set("posting_frequency", e.target.value)}
          disabled={loading}
        >
          {FREQUENCIES.map((f) => <SelectItem key={f} value={f} text={f} />)}
        </Select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        <Select
          id="gen-tone"
          labelText="Tone / Style"
          value={form.tone_style}
          onChange={(e) => set("tone_style", e.target.value)}
          disabled={loading}
        >
          {TONES.map((t) => <SelectItem key={t} value={t} text={t} />)}
        </Select>

        <DatePicker
          datePickerType="single"
          value={form.week_starting}
          onChange={(dates: Date[]) => {
            if (dates[0]) set("week_starting", dates[0].toISOString().slice(0, 10));
          }}
        >
          <DatePickerInput
            id="gen-week"
            labelText="Week Starting"
            placeholder="YYYY-MM-DD"
          />
        </DatePicker>
      </div>

      <Button
        type="submit"
        kind="primary"
        disabled={loading}
        renderIcon={loading ? undefined : Lightning}
        style={{ width: "100%", maxWidth: "100%" }}
      >
        {loading ? (
          <InlineLoading description="Generating 7 ideas..." status="active" />
        ) : (
          "Generate 7-Day Content Plan"
        )}
      </Button>
    </Form>
  );
}
