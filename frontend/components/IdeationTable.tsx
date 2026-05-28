"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import IdeationTableRow from "@/components/IdeationTableRow";
import BulkActionBar from "@/components/BulkActionBar";
import { api } from "@/lib/api";
import type { Ideation, IdeationStatus } from "@/lib/types";

type SortKey = "created_at" | "upload_date";

interface IdeationTableProps {
  ideations: Ideation[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  sortBy: SortKey;
  sortDir: "asc" | "desc";
  onSortChange: (key: SortKey) => void;
  onPageChange: (p: number) => void;
  onDeleted: (id: string) => void;
  refetch: () => void;
}

const LIMIT = 20;

export default function IdeationTable({
  ideations,
  total,
  page,
  loading,
  error,
  sortBy,
  sortDir,
  onSortChange,
  onPageChange,
  onDeleted,
  refetch,
}: IdeationTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const totalPages = Math.ceil(total / LIMIT);

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelected(new Set(ideations.map((i) => i.id)));
    else setSelected(new Set());
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    setBulkError(null);
    try {
      await api.post("/ideations/bulk-delete", { ids: Array.from(selected) });
      setSelected(new Set());
      refetch();
    } catch {
      setBulkError("Bulk delete failed. Please try again.");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkStatus = async (status: IdeationStatus) => {
    setBulkLoading(true);
    setBulkError(null);
    try {
      await api.post("/ideations/bulk-status", { ids: Array.from(selected), status });
      setSelected(new Set());
      refetch();
    } catch {
      setBulkError("Bulk status update failed. Please try again.");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleScriptGenerated = (scriptId: string) => {
    router.push(`/script/scripts/${scriptId}`);
  };

  const SortIcon = ({ colKey }: { colKey: SortKey }) => {
    if (sortBy !== colKey) return <svg className="w-3.5 h-3.5 text-gray-300 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>;
    return sortDir === "asc"
      ? <svg className="w-3.5 h-3.5 text-indigo-500 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
      : <svg className="w-3.5 h-3.5 text-indigo-500 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
        <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-sm text-gray-500">Loading ideations…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  if (ideations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
        <p className="text-gray-400 text-sm">No ideations found. Create one or generate a content plan!</p>
      </div>
    );
  }

  const allSelected = ideations.length > 0 && ideations.every((i) => selected.has(i.id));

  return (
    <>
      {bulkError && (
        <div className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm flex justify-between">
          <span>{bulkError}</span>
          <button onClick={() => setBulkError(null)} className="ml-4 font-bold">×</button>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Title</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Platform</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  <button
                    onClick={() => onSortChange("upload_date")}
                    className="flex items-center text-gray-600 hover:text-gray-900"
                  >
                    Upload Date
                    <SortIcon colKey="upload_date" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ideations.map((ideation) => (
                <IdeationTableRow
                  key={ideation.id}
                  ideation={ideation}
                  selected={selected.has(ideation.id)}
                  onSelect={handleSelect}
                  onDeleted={(id) => { onDeleted(id); setSelected((s) => { const n = new Set(s); n.delete(id); return n; }); }}
                  onScriptGenerated={handleScriptGenerated}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
            <span>Page {page} of {totalPages} · {total} ideations</span>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <BulkActionBar
        count={selected.size}
        onDelete={handleBulkDelete}
        onStatusChange={handleBulkStatus}
        loading={bulkLoading}
      />
    </>
  );
}
