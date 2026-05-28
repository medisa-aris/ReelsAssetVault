"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import IdeationTable from "@/components/IdeationTable";
import { useIdeations } from "@/hooks/useIdeations";

const STATUSES = ["Draft", "Approved", "Script Generated", "Published"];

export default function IdeationListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState<"created_at" | "upload_date">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { ideations, total, page, loading, error, setPage, refetch } = useIdeations({
    search: search || undefined,
    status: statusFilter || undefined,
    sort_by: sortBy,
    sort_dir: sortDir,
  });

  const handleSortChange = useCallback(
    (key: "created_at" | "upload_date") => {
      if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else { setSortBy(key); setSortDir("desc"); }
    },
    [sortBy]
  );

  const handleDeleted = useCallback((id: string) => {
    refetch();
  }, [refetch]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ideation</h1>
            {!loading && !error && (
              <p className="text-sm text-gray-500 mt-0.5">{total} idea{total !== 1 ? "s" : ""}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/script/ideation/generate"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Plan
            </Link>
            <Link
              href="/script/ideation/create"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create Ideation
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ideations…"
            className="flex-1 min-w-[200px] max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={`${sortBy}-${sortDir}`}
            onChange={(e) => {
              const [k, d] = e.target.value.split("-") as ["created_at" | "upload_date", "asc" | "desc"];
              setSortBy(k); setSortDir(d);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="upload_date-asc">Upload Date ↑</option>
            <option value="upload_date-desc">Upload Date ↓</option>
          </select>
        </div>

        <IdeationTable
          ideations={ideations}
          total={total}
          page={page}
          loading={loading}
          error={error}
          sortBy={sortBy}
          sortDir={sortDir}
          onSortChange={handleSortChange}
          onPageChange={(p) => setPage(p)}
          onDeleted={handleDeleted}
          refetch={refetch}
        />
      </main>
    </div>
  );
}
