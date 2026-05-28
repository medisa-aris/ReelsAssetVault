"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Tag } from "@/lib/types";

interface TagInputProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
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

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-400 italic">Loading tags…</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const selected = selectedIds.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${
              selected
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"
            }`}
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
