"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableSelectAll,
  TableSelectRow,
  TableBatchActions,
  TableBatchAction,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Pagination,
  DataTableSkeleton,
  InlineNotification,
  Button,
  OverflowMenu,
  OverflowMenuItem,
} from "@carbon/react";
import { TrashCan, Renew } from "@carbon/icons-react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useNotification } from "@/components/NotificationProvider";
import type { Ideation, IdeationStatus, Script } from "@/lib/types";

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
const STATUSES: IdeationStatus[] = ["Draft", "Approved", "Script Generated", "Published"];

const headers = [
  { key: "title", header: "Title" },
  { key: "platform", header: "Platform" },
  { key: "status", header: "Status" },
  { key: "uploadDate", header: "Upload Date" },
  { key: "actions", header: "Actions" },
];

export default function IdeationTable({
  ideations,
  total,
  page,
  loading,
  error,
  onPageChange,
  onDeleted,
  refetch,
}: IdeationTableProps) {
  const router = useRouter();
  const { notify } = useNotification();

  const handleBulkDelete = useCallback(
    async (selectedRows: { id: string }[]) => {
      try {
        await api.post("/ideations/bulk-delete", { ids: selectedRows.map((r) => r.id) });
        refetch();
      } catch {
        notify("error", "Bulk delete failed", "Please try again.");
      }
    },
    [refetch, notify]
  );

  const handleBulkStatus = useCallback(
    async (selectedRows: { id: string }[], status: IdeationStatus) => {
      try {
        await api.post("/ideations/bulk-status", { ids: selectedRows.map((r) => r.id), status });
        refetch();
      } catch {
        notify("error", "Bulk status update failed", "Please try again.");
      }
    },
    [refetch, notify]
  );

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/ideations/${id}`);
      onDeleted(id);
    } catch {
      notify("error", "Delete failed", "Please try again.");
    }
  };

  const handleGenerateScript = async (ideationId: string) => {
    try {
      const res = await api.post<Script>("/scripts/generate", { ideation_id: ideationId, language: "en" });
      router.push(`/script/scripts/${res.data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      notify("error", "Script generation failed", msg || "Ensure an AI provider is active in Admin → AI Config.");
    }
  };

  if (loading) {
    return <DataTableSkeleton columnCount={5} rowCount={10} headers={headers} />;
  }

  if (error) {
    return <InlineNotification kind="error" title="Failed to load ideations" subtitle={error} />;
  }

  const rows = ideations.map((i) => ({
    id: i.id,
    title: i.title,
    platform: i.platform ?? "-",
    status: i.id, // sentinel — resolved in custom cell
    uploadDate: i.upload_date ? formatDate(i.upload_date) : "-",
    actions: i.id, // sentinel
  }));

  const ideationMap = new Map(ideations.map((i) => [i.id, i]));

  return (
    <>
      <DataTable rows={rows} headers={headers}>
        {({
          rows: tableRows,
          headers: tableHeaders,
          selectedRows,
          getHeaderProps,
          getTableProps,
          getTableContainerProps,
          getRowProps,
          getSelectionProps,
          getBatchActionProps,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }: any) => (
          <TableContainer
            {...getTableContainerProps()}
            title="Ideations"
            description={`${total} ideation${total !== 1 ? "s" : ""}`}
          >
            <TableBatchActions {...getBatchActionProps()}>
              <TableBatchAction
                renderIcon={TrashCan}
                onClick={() => handleBulkDelete(selectedRows)}
              >
                Delete
              </TableBatchAction>
              {STATUSES.map((s) => (
                <TableBatchAction
                  key={s}
                  renderIcon={Renew}
                  onClick={() => handleBulkStatus(selectedRows, s)}
                >
                  Set: {s}
                </TableBatchAction>
              ))}
            </TableBatchActions>

            <TableToolbar>
              <TableToolbarContent>
                <TableToolbarSearch placeholder="Search ideations..." />
              </TableToolbarContent>
            </TableToolbar>

            {ideations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--cds-text-secondary)" }}>
                <p style={{ fontSize: "0.875rem" }}>No ideations found. Create one or generate a content plan!</p>
              </div>
            ) : (
              <Table {...getTableProps()} size="md">
                <TableHead>
                  <TableRow>
                    <TableSelectAll {...getSelectionProps()} />
                    {tableHeaders.map((header: { key: string; header: string }) => (
                      <TableHeader key={header.key} {...getHeaderProps({ header })}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableRows.map((row: { id: string; cells: { id: string; value: string; info: { header: string } }[] }) => {
                    const ideation = ideationMap.get(row.id);
                    if (!ideation) return null;
                    return (
                      <TableRow key={row.id} {...getRowProps({ row })}>
                        <TableSelectRow {...getSelectionProps({ row })} />
                        {row.cells.map((cell) => {
                          if (cell.info.header === "title") {
                            return (
                              <TableCell key={cell.id}>
                                <Link
                                  href={`/script/ideation/${ideation.id}`}
                                  style={{ fontWeight: 500, color: "var(--cds-text-primary)", textDecoration: "none" }}
                                >
                                  {ideation.title}
                                </Link>
                                {ideation.is_ai_generated && (
                                  <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", background: "var(--cds-tag-background-purple)", color: "var(--cds-tag-color-purple)", padding: "0.1rem 0.4rem", borderRadius: "1rem" }}>
                                    AI
                                  </span>
                                )}
                              </TableCell>
                            );
                          }
                          if (cell.info.header === "status") {
                            return (
                              <TableCell key={cell.id}>
                                <StatusBadge status={ideation.status} />
                              </TableCell>
                            );
                          }
                          if (cell.info.header === "actions") {
                            return (
                              <TableCell key={cell.id}>
                                <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                                  <Button kind="ghost" size="sm" as={Link} href={`/script/ideation/${ideation.id}`}>
                                    View
                                  </Button>
                                  <Button
                                    kind="ghost"
                                    size="sm"
                                    onClick={() => handleGenerateScript(ideation.id)}
                                  >
                                    Script
                                  </Button>
                                  <Button
                                    kind="danger--ghost"
                                    size="sm"
                                    onClick={() => handleDelete(ideation.id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            );
                          }
                          return <TableCell key={cell.id}>{cell.value}</TableCell>;
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
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
