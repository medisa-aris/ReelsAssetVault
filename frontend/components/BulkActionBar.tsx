"use client";

import { useState } from "react";
import type { IdeationStatus } from "@/lib/types";

const STATUSES: IdeationStatus[] = ["Draft", "Approved", "Script Generated", "Published"];

interface BulkActionBarProps {
  count: number;
  onDelete: () => void;
  onStatusChange: (status: IdeationStatus) => void;
  loading?: boolean;
}

export default function BulkActionBar({ count, onDelete, onStatusChange, loading }: BulkActionBarProps) {
  const [statusOpen, setStatusOpen] = useState(false);

  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl">
      <span className="text-sm font-medium text-gray-300">
        {count} selected
      </span>

      <div className="w-px h-5 bg-gray-600" />

      <button
        onClick={onDelete}
        disabled={loading}
        className="flex items-center gap-1.5 text-sm font-medium text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete
      </button>

      <div className="relative">
        <button
          onClick={() => setStatusOpen((v) => !v)}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-200 hover:text-white disabled:opacity-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Change Status
          <svg className={`w-3.5 h-3.5 transition-transform ${statusOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {statusOpen && (
          <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[150px]">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => { onStatusChange(s); setStatusOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
