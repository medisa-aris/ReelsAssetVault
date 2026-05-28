"use client";

import { useState } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSchedules } from "@/hooks/useSchedules";
import ScheduleTable from "@/components/ScheduleTable";

const STATUS_OPTIONS = [
  "",
  "Draft",
  "Pending Review",
  "Approved",
  "Scheduled",
  "Published",
  "Rejected",
];

export default function PublishSchedulePage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const isApprover = user?.roles?.some((r) => r === "admin" || r === "reviewer") ?? false;

  const { schedules, total, page, loading, error, setPage, refetch } = useSchedules({
    search: search || undefined,
    status: status || undefined,
    sort_by: "scheduled_date",
    sort_dir: "asc",
  });

  return (
    <>
      <Navigation />
      <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Publish Schedule</h1>
          <p className="text-sm text-gray-500 mt-1">Plan and track your content publishing pipeline</p>
        </div>
        <Link
          href="/production/schedule/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Schedule
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by caption…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s || "All statuses"}
            </option>
          ))}
        </select>
      </div>

      <ScheduleTable
        schedules={schedules}
        total={total}
        page={page}
        loading={loading}
        error={error}
        isApprover={isApprover}
        onPageChange={setPage}
        onRefresh={refetch}
      />
    </div>
    </>
  );
}
