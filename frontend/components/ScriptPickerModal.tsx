"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Script } from "@/lib/types";

interface ScriptPickerModalProps {
  open: boolean;
  onSelect: (script: Script) => void;
  onClose: () => void;
}

export default function ScriptPickerModal({ open, onSelect, onClose }: ScriptPickerModalProps) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get("/scripts", { params: { page: 1, limit: 50, search: search || undefined } })
      .then((res) => setScripts(res.data.items ?? []))
      .catch(() => setScripts([]))
      .finally(() => setLoading(false));
  }, [open, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 flex flex-col gap-4 max-h-[80vh]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Select Script</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
        </div>

        <input
          type="text"
          placeholder="Search scripts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
          {loading && <p className="text-sm text-gray-500 py-4 text-center">Loading...</p>}
          {!loading && scripts.length === 0 && (
            <p className="text-sm text-gray-500 py-4 text-center">No scripts found</p>
          )}
          {scripts.map((script) => (
            <button
              key={script.id}
              onClick={() => { onSelect(script); onClose(); }}
              className="w-full flex flex-col items-start px-2 py-3 hover:bg-gray-50 text-left transition-colors"
            >
              <p className="text-sm font-medium text-gray-900">{script.title}</p>
              {script.ideation_title && (
                <p className="text-xs text-gray-500">Ideation: {script.ideation_title}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

