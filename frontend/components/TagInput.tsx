"use client";

import { useEffect, useState } from "react";
import { MultiSelect } from "@carbon/react";
import { api } from "@/lib/api";
import type { Tag } from "@/lib/types";

interface TagInputProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

interface Item {
  id: string;
  label: string;
}

export default function TagInput({ selectedIds, onChange }: TagInputProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Tag[]>("/tags")
      .then((r) => setTags(r.data))
      .catch(() => setTags([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p style={{ fontSize: "0.875rem", color: "var(--cds-text-placeholder)", fontStyle: "italic" }}>
        Loading tags…
      </p>
    );
  }

  const items: Item[] = tags.map((t) => ({ id: t.id, label: t.name }));
  const initialSelected = items.filter((i) => selectedIds.includes(i.id));

  return (
    // key forces remount when selectedIds changes from outside (e.g., form reset)
    <MultiSelect
      key={selectedIds.join(",")}
      id="tag-input"
      label="Select tags"
      titleText="Tags"
      items={items}
      itemToString={(item: Item | null) => item?.label ?? ""}
      initialSelectedItems={initialSelected}
      onChange={({ selectedItems }: { selectedItems: Item[] }) =>
        onChange(selectedItems.map((i) => i.id))
      }
    />
  );
}
