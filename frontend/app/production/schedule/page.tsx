"use client";

import { useState } from "react";
import { Search, Dropdown, Button } from "@carbon/react";
import { Add } from "@carbon/icons-react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { PageLayout } from "@/components/PageLayout";
import { useAuth } from "@/hooks/useAuth";
import { useSchedules } from "@/hooks/useSchedules";
import ScheduleTable from "@/components/ScheduleTable";

const STATUS_OPTIONS = [
  { id: "", text: "All statuses" },
  { id: "Draft", text: "Draft" },
  { id: "Pending Review", text: "Pending Review" },
  { id: "Approved", text: "Approved" },
  { id: "Scheduled", text: "Scheduled" },
  { id: "Published", text: "Published" },
  { id: "Rejected", text: "Rejected" },
];

export default function PublishSchedulePage() {
  const router = useRouter();
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
      <PageLayout maxWidth="max">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="cds--type-productive-heading-04">Publish Schedule</h1>
            <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)", marginTop: "0.25rem" }}>
              Plan and track your content publishing pipeline
            </p>
          </div>
          <Button kind="primary" renderIcon={Add} onClick={() => router.push("/production/schedule/create")}>
            New Schedule
          </Button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <Search
            id="schedule-search"
            labelText="Search schedules"
            placeholder="Search by caption..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            size="md"
            style={{ flex: 1, minWidth: "12rem", maxWidth: "20rem" }}
          />
          <Dropdown
            id="status-filter"
            titleText=""
            label="All statuses"
            items={STATUS_OPTIONS}
            itemToString={(item: { id: string; text: string } | null) => item?.text ?? ""}
            selectedItem={STATUS_OPTIONS.find((o) => o.id === status) ?? STATUS_OPTIONS[0]}
            onChange={({ selectedItem }: { selectedItem: { id: string; text: string } }) => {
              setStatus(selectedItem.id);
              setPage(1);
            }}
          />
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
      </PageLayout>
    </>
  );
}
