"use client";

import { useState } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { PageLayout } from "@/components/PageLayout";
import { Button, Search, InlineNotification } from "@carbon/react";
import { useScripts } from "@/hooks/useScripts";
import { formatDate } from "@/lib/utils";

export default function ScriptListPage() {
  const [search, setSearch] = useState("");
  const { scripts, total, page, loading, error, setPage } = useScripts({
    search: search || undefined,
  });

  const totalPages = Math.ceil(total / 20);

  return (
    <>
      <Navigation />
      <PageLayout maxWidth="max">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="cds--type-productive-heading-04">Scripts</h1>
            {!loading && !error && (
              <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)", marginTop: "0.25rem" }}>
                {total} script{total !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: "1.25rem" }}>
          <Search
            id="scripts-search"
            labelText="Search scripts"
            placeholder="Search scripts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="md"
            style={{ maxWidth: "20rem" }}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e0e0e0", padding: "4rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>Loading scripts…</p>
          </div>
        ) : error ? (
          <InlineNotification kind="error" title={error} />
        ) : scripts.length === 0 ? (
          <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e0e0e0", padding: "4rem", textAlign: "center" }}>
            <p style={{ color: "var(--cds-text-secondary)", fontSize: "0.875rem" }}>No scripts yet. Generate one from an ideation!</p>
            <Link href="/script/ideation" style={{ marginTop: "0.75rem", display: "inline-block", fontSize: "0.875rem", color: "#0f62fe" }}>
              Go to Ideation →
            </Link>
          </div>
        ) : (
          <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e0e0e0", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ minWidth: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e0e0e0", backgroundColor: "#f4f4f4" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--cds-text-secondary)" }}>Title</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--cds-text-secondary)" }}>Source Ideation</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--cds-text-secondary)" }}>Created</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--cds-text-secondary)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scripts.map((script) => (
                    <tr key={script.id} style={{ borderBottom: "1px solid #f4f4f4" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <Link
                          href={`/script/scripts/${script.id}`}
                          style={{ fontWeight: 500, color: "#161616" }}
                        >
                          {script.title}
                        </Link>
                        {script.is_ai_generated && (
                          <span style={{ marginLeft: "8px", fontSize: "0.75rem", backgroundColor: "#f0e6ff", color: "#6929c4", padding: "2px 6px", borderRadius: "4px", fontWeight: 500 }}>AI</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--cds-text-secondary)" }}>
                        {script.ideation_title ? (
                          <Link href={`/script/ideation/${script.ideation_id}`} style={{ color: "var(--cds-text-secondary)" }}>
                            {script.ideation_title}
                          </Link>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--cds-text-secondary)", whiteSpace: "nowrap" }}>
                        {formatDate(script.created_at)}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <Link href={`/script/scripts/${script.id}`} style={{ fontSize: "0.875rem", color: "#0f62fe" }}>View</Link>
                          <Link href={`/script/scripts/${script.id}?mode=edit`} style={{ fontSize: "0.875rem", color: "#0f62fe" }}>Edit</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: "12px 16px", borderTop: "1px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
                <span>Page {page} of {totalPages} · {total} scripts</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Button kind="ghost" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                    Previous
                  </Button>
                  <Button kind="ghost" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </PageLayout>
    </>
  );
}
