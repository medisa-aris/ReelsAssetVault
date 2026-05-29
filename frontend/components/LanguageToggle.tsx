"use client";

import { ContentSwitcher, Switch } from "@carbon/react";

export type Language = "en" | "id";

interface LanguageToggleProps {
  value: Language;
  onChange: (lang: Language) => void;
}

export default function LanguageToggle({ value, onChange }: LanguageToggleProps) {
  return (
    <ContentSwitcher
      selectedIndex={value === "en" ? 0 : 1}
      onChange={({ index }: { index?: number }) =>
        onChange((index ?? 0) === 0 ? "en" : "id")
      }
      size="sm"
    >
      <Switch name="en" text="English" />
      <Switch name="id" text="Bahasa" />
    </ContentSwitcher>
  );
}
