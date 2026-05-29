"use client";

import { useState, useCallback } from "react";
import { Search, Dropdown, Button } from "@carbon/react";
import { Lightning, Add } from "@carbon/icons-react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import IdeationTable from "@/components/IdeationTable";
import { PageLayout } from "@/components/PageLayout";
import { useIdeations } from "@/hooks/useIdeations";

const STATUSES = ["Draft", "Approved", "Script Generated", "Published"];
const SORT_OPTIONS = [
  { id: "created_at-desc", text: "Newest First" },
  { id: "created_at-asc", text: "Oldest First" },
  { id: "upload_date-asc", text: "Upload Date ↑" },
  { id: "upload_date-desc", text: "Upload Date ↓" },
];

export default function IdeationListPage() {
  const router = useRouter();
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

  return (
    <>
      <Navigation />
      <PageLayout maxWidth="max">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="cds--type-productive-heading-04">Ideation</h1>
            {!loading && !error && (
              <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)", marginTop: "0.25rem" }}>
                {total} idea{total !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Button kind="secondary" renderIcon={Lightning} onClick={() => router.push("/script/ideation/generate")}>
              Generate Plan
            </Button>
            <Button kind="primary" renderIcon={Add} onClick={() => router.push("/script/ideation/create")}>
              Create Ideation
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <Search
            id="ideation-search"
            labelText="Search ideations"
            placeholder="Search ideations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="md"
            style={{ flex: 1, minWidth: "12rem", maxWidth: "20rem" }}
          />
          <Dropdown
            id="status-filter"
            titleText=""
            label="All Statuses"
            items={["", ...STATUSES]}
            itemToString={(item: string) => item || "All Statuses"}
            selectedItem={statusFilter}
            onChange={({ selectedItem }: { selectedItem: string }) => setStatusFilter(selectedItem || "")}
          />
          <Dropdown
            id="sort-filter"
            titleText=""
            label="Sort"
            items={SORT_OPTIONS}
            itemToString={(item: { id: string; text: string } | null) => item?.text ?? ""}
            selectedItem={SORT_OPTIONS.find((o) => o.id === `${sortBy}-${sortDir}`) ?? SORT_OPTIONS[0]}
            onChange={({ selectedItem }: { selectedItem: { id: string; text: string } }) => {
              const [k, d] = selectedItem.id.split("-") as ["created_at" | "upload_date", "asc" | "desc"];
              setSortBy(k); setSortDir(d);
            }}
          />
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
          onDeleted={() => refetch()}
          refetch={refetch}
        />
      </PageLayout>
    </>
  );
}
