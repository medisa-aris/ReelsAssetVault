"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Ideation } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

interface IdeationPickerModalProps {
  open: boolean;
  onSelect: (ideation: Ideation) => void;
  onClose: () => void;
}

export default function IdeationPickerModal({ open, onSelect, onClose }: IdeationPickerModalProps) {
  const [ideations, setIdeations] = useState<Ideation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get("/ideations", { params: { page: 1, limit: 50, search: search || undefined } })
      .then((res) => setIdeations(res.data.items ?? []))
      .catch(() => setIdeations([]))
      .finally(() => setLoading(false));
  }, [open, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 flex flex-col gap-4 max-h-[80vh]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Select Ideation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
        </div>

        <input
          type="text"
          placeholder="Search ideations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
          {loading && <p className="text-sm text-gray-500 py-4 text-center">Loading...</p>}
          {!loading && ideations.length === 0 && (
            <p className="text-sm text-gray-500 py-4 text-center">No ideations found</p>
          )}
          {ideations.map((ideation) => (
            <button
              key={ideation.id}
              onClick={() => { onSelect(ideation); onClose(); }}
              className="w-full flex items-center justify-between px-2 py-3 hover:bg-gray-50 text-left transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{ideation.title}</p>
                {ideation.platform && (
                  <p className="text-xs text-gray-500">{ideation.platform}</p>
                )}
              </div>
              <StatusBadge status={ideation.status} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

