"use client";

import { ContentSwitcher, Switch } from "@carbon/react";

interface SegmentedToggleProps {
  value: "view" | "edit";
  onChange: (v: "view" | "edit") => void;
}

export default function SegmentedToggle({ value, onChange }: SegmentedToggleProps) {
  return (
    <ContentSwitcher
      selectedIndex={value === "view" ? 0 : 1}
      onChange={({ index }: { index?: number }) =>
        onChange((index ?? 0) === 0 ? "view" : "edit")
      }
      style={{ width: "200px" }}
    >
      <Switch name="view" text="View" style={{ width: "100px", maxWidth: "100px" }} />
      <Switch name="edit" text="Edit" style={{ width: "100px", maxWidth: "100px" }} />
    </ContentSwitcher>
  );
}
