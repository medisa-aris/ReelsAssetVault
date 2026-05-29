"use client";

import { useState, useEffect } from "react";
import {
  ComposedModal,
  ModalHeader,
  ModalBody,
  Search,
  InlineLoading,
} from "@carbon/react";
import { api } from "@/lib/api";
import { Ideation } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

interface IdeationPickerModalProps {
  open: boolean;
  onSelect: (ideation: Ideation) => void;
  onClose: () => void;
}

export default function IdeationPickerModal({ open, onSelect, onClose }: IdeationPickerModalProps) {
  const [ideations, setIdeations] = useState<Ideation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get("/ideations", { params: { page: 1, limit: 50, search: search || undefined } })
      .then((res) => setIdeations(res.data.items ?? []))
      .catch(() => setIdeations([]))
      .finally(() => setLoading(false));
  }, [open, search]);

  return (
    <ComposedModal open={open} onClose={onClose} size="sm">
      <ModalHeader title="Select Ideation" />
      <ModalBody hasScrollingContent>
        <Search
          id="ideation-search"
          labelText="Search ideations"
          placeholder="Search ideations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="md"
          style={{ marginBottom: "1rem" }}
        />
        <div style={{ minHeight: "16rem" }}>
          {loading ? (
            <InlineLoading description="Loading ideations..." />
          ) : ideations.length === 0 ? (
            <p style={{ color: "var(--cds-text-placeholder)", fontSize: "0.875rem", padding: "2rem 0", textAlign: "center" }}>
              No ideations found
            </p>
          ) : (
            ideations.map((ideation) => (
              <button
                key={ideation.id}
                onClick={() => { onSelect(ideation); onClose(); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "0.75rem 0.5rem",
                  borderBottom: "1px solid var(--cds-border-subtle-01)",
                  background: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "var(--cds-text-primary)",
                }}
              >
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>{ideation.title}</p>
                  {ideation.platform && (
                    <p style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>{ideation.platform}</p>
                  )}
                </div>
                <StatusBadge status={ideation.status} />
              </button>
            ))
          )}
        </div>
      </ModalBody>
    </ComposedModal>
  );
}
