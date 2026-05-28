"use client";

import { PublishSchedule } from "@/lib/types";
import ScheduleTableRow from "@/components/ScheduleTableRow";

interface ScheduleTableProps {
  schedules: PublishSchedule[];
  total: number;
  page: number;
  limit?: number;
  loading: boolean;
  error: string | null;
  isApprover: boolean;
  onPageChange: (p: number) => void;
  onRefresh: () => void;
}

export default function ScheduleTable({
  schedules,
  total,
  page,
  limit = 20,
  loading,
  error,
  isApprover,
  onPageChange,
  onRefresh,
}: ScheduleTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Asset</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Caption / Ideation</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Scheduled</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-red-500">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && schedules.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                  No schedules found
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              schedules.map((s) => (
                <ScheduleTableRow
                  key={s.id}
                  schedule={s}
                  isApprover={isApprover}
                  onStatusUpdate={onRefresh}
                />
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {total} result{total !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <span className="text-sm text-gray-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
