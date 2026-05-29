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
import { Script } from "@/lib/types";

interface ScriptPickerModalProps {
  open: boolean;
  onSelect: (script: Script) => void;
  onClose: () => void;
}

export default function ScriptPickerModal({ open, onSelect, onClose }: ScriptPickerModalProps) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get("/scripts", { params: { page: 1, limit: 50, search: search || undefined } })
      .then((res) => setScripts(res.data.items ?? []))
      .catch(() => setScripts([]))
      .finally(() => setLoading(false));
  }, [open, search]);

  return (
    <ComposedModal open={open} onClose={onClose} size="sm">
      <ModalHeader title="Select Script" />
      <ModalBody hasScrollingContent>
        <Search
          id="script-search"
          labelText="Search scripts"
          placeholder="Search scripts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="md"
          style={{ marginBottom: "1rem" }}
        />
        <div style={{ minHeight: "16rem" }}>
          {loading ? (
            <InlineLoading description="Loading scripts..." />
          ) : scripts.length === 0 ? (
            <p style={{ color: "var(--cds-text-placeholder)", fontSize: "0.875rem", padding: "2rem 0", textAlign: "center" }}>
              No scripts found
            </p>
          ) : (
            scripts.map((script) => (
              <button
                key={script.id}
                onClick={() => { onSelect(script); onClose(); }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  width: "100%",
                  padding: "0.75rem 0.5rem",
                  borderBottom: "1px solid var(--cds-border-subtle-01)",
                  background: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "var(--cds-text-primary)",
                }}
              >
                <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>{script.title}</p>
                {script.ideation_title && (
                  <p style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>
                    Ideation: {script.ideation_title}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      </ModalBody>
    </ComposedModal>
  );
}
