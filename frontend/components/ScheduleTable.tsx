"use client";

import {
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  Pagination,
  DataTableSkeleton,
  InlineNotification,
} from "@carbon/react";
import ScheduleTableRow from "@/components/ScheduleTableRow";
import type { PublishSchedule } from "@/lib/types";

const LIMIT = 20;

const headers = [
  { key: "asset", header: "Asset" },
  { key: "caption", header: "Caption / Ideation" },
  { key: "scheduled", header: "Scheduled" },
  { key: "status", header: "Status" },
  { key: "actions", header: "Actions" },
];

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
  loading,
  error,
  isApprover,
  onPageChange,
  onRefresh,
}: ScheduleTableProps) {
  if (loading) {
    return <DataTableSkeleton columnCount={5} rowCount={10} headers={headers} />;
  }

  if (error) {
    return <InlineNotification kind="error" title="Failed to load schedules" subtitle={error} />;
  }

  // DataTable needs rows — but since ScheduleTableRow renders custom <tr> content,
  // we use a plain table approach inside DataTable's container for consistent styling.
  const rows = schedules.map((s) => ({
    id: s.id,
    asset: s.id,
    caption: s.id,
    scheduled: s.id,
    status: s.id,
    actions: s.id,
  }));

  const scheduleMap = new Map(schedules.map((s) => [s.id, s]));

  return (
    <>
      <DataTable rows={rows} headers={headers}>
        {({ rows: tableRows, headers: tableHeaders, getHeaderProps, getTableProps, getTableContainerProps }: any) => (
          <TableContainer
            {...getTableContainerProps()}
            title="Publish Schedule"
            description={`${total} schedule${total !== 1 ? "s" : ""}`}
          >
            {schedules.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--cds-text-secondary)" }}>
                <p style={{ fontSize: "0.875rem" }}>No schedules found. Create your first publish schedule.</p>
              </div>
            ) : (
              <Table {...getTableProps()} size="md">
                <TableHead>
                  <TableRow>
                    {tableHeaders.map((header: { key: string; header: string }) => (
                      <TableHeader {...getHeaderProps({ header })}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <tbody>
                  {tableRows.map((row: { id: string }) => {
                    const schedule = scheduleMap.get(row.id);
                    if (!schedule) return null;
                    return (
                      <ScheduleTableRow
                        key={schedule.id}
                        schedule={schedule}
                        isApprover={isApprover}
                        onStatusUpdate={onRefresh}
                      />
                    );
                  })}
                </tbody>
              </Table>
            )}
          </TableContainer>
        )}
      </DataTable>

      {total > 0 && (
        <Pagination
          totalItems={total}
          pageSize={LIMIT}
          page={page}
          pageSizes={[LIMIT]}
          onChange={({ page: p }) => onPageChange(p)}
        />
      )}
    </>
  );
}
