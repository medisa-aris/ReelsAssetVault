"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TableCell,
  Button,
  ComposedModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  TextArea,
} from "@carbon/react";
import { api } from "@/lib/api";
import { storageUrl } from "@/lib/utils";
import ScheduleStatusBadge from "@/components/ScheduleStatusBadge";
import { useNotification } from "@/components/NotificationProvider";
import type { PublishSchedule } from "@/lib/types";

interface ScheduleTableRowProps {
  schedule: PublishSchedule;
  isApprover: boolean;
  onStatusUpdate: () => void;
}

export default function ScheduleTableRow({ schedule, isApprover, onStatusUpdate }: ScheduleTableRowProps) {
  const { notify } = useNotification();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleSubmit = async () => {
    try {
      await api.patch(`/production/schedules/${schedule.id}/submit`);
      onStatusUpdate();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to submit";
      notify("error", "Submit failed", msg);
    }
  };

  const handleApprove = async () => {
    try {
      await api.patch(`/production/schedules/${schedule.id}/approve`);
      onStatusUpdate();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to approve";
      notify("error", "Approve failed", msg);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) return;
    try {
      await api.patch(`/production/schedules/${schedule.id}/reject`, { reason: rejectReason });
      setRejectOpen(false);
      setRejectReason("");
      onStatusUpdate();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to reject";
      notify("error", "Reject failed", msg);
    }
  };

  const captionPreview = schedule.caption
    ? schedule.caption.length > 60
      ? schedule.caption.slice(0, 60) + "..."
      : schedule.caption
    : "-";

  return (
    <>
      <tr style={{ borderBottom: "1px solid var(--cds-border-subtle-01)" }}>
        {/* Asset thumbnail */}
        <TableCell>
          {schedule.asset_thumbnail_url ? (
            <img
              src={storageUrl(schedule.asset_thumbnail_url) ?? ""}
              alt={schedule.asset_title ?? ""}
              style={{ width: "3rem", height: "3rem", objectFit: "cover", borderRadius: "4px" }}
            />
          ) : (
            <div style={{ width: "3rem", height: "3rem", background: "var(--cds-layer-02)", borderRadius: "4px" }} />
          )}
        </TableCell>

        {/* Caption + ideation */}
        <TableCell>
          <p style={{ fontSize: "0.875rem", color: "var(--cds-text-primary)" }}>{captionPreview}</p>
          {schedule.ideation_title && (
            <p style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>
              Ideation: {schedule.ideation_title}
            </p>
          )}
          {schedule.asset_title && (
            <p style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>
              Asset: {schedule.asset_title}
            </p>
          )}
          {schedule.rejection_reason && (
            <p style={{ fontSize: "0.75rem", color: "var(--cds-support-error)", marginTop: "0.25rem" }}
              title={schedule.rejection_reason}>
              {schedule.rejection_reason.slice(0, 60)}{schedule.rejection_reason.length > 60 ? "..." : ""}
            </p>
          )}
        </TableCell>

        {/* Scheduled */}
        <TableCell>
          <span style={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>{schedule.scheduled_date}</span>
          <span style={{ display: "block", fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>
            {schedule.scheduled_time}
          </span>
        </TableCell>

        {/* Status */}
        <TableCell>
          <ScheduleStatusBadge status={schedule.status} />
        </TableCell>

        {/* Actions */}
        <TableCell>
          <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
            <Button kind="ghost" size="sm" as={Link} href={`/production/schedule/${schedule.id}`}>
              View
            </Button>

            {(schedule.status === "Draft" || schedule.status === "Rejected") && (
              <Button kind="ghost" size="sm" onClick={handleSubmit}>
                Submit
              </Button>
            )}

            {schedule.status === "Pending Review" && isApprover && (
              <>
                <Button kind="primary" size="sm" onClick={handleApprove}>
                  Approve
                </Button>
                <Button kind="danger--ghost" size="sm" onClick={() => setRejectOpen(true)}>
                  Reject
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </tr>

      {/* Reject reason modal — Carbon portals this to document.body, so <tr> wrapper is valid */}
      <ComposedModal open={rejectOpen} onClose={() => { setRejectOpen(false); setRejectReason(""); }}>
        <ModalHeader title="Reject Schedule Entry" />
        <ModalBody>
          <TextArea
            id={`reject-reason-${schedule.id}`}
            labelText="Rejection reason (required)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            placeholder="Describe why this entry is being rejected..."
            invalid={rejectOpen && !rejectReason.trim()}
            invalidText="Rejection reason is required"
          />
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={() => { setRejectOpen(false); setRejectReason(""); }}>
            Cancel
          </Button>
          <Button kind="danger" disabled={!rejectReason.trim()} onClick={handleRejectConfirm}>
            Confirm Reject
          </Button>
        </ModalFooter>
      </ComposedModal>
    </>
  );
}
