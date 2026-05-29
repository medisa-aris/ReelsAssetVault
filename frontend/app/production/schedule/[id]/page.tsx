"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { PageLayout } from "@/components/PageLayout";
import { useNotification } from "@/components/NotificationProvider";
import { Button, InlineNotification, TextInput, TextArea } from "@carbon/react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PublishSchedule } from "@/lib/types";
import { storageUrl } from "@/lib/utils";
import ScheduleStatusBadge from "@/components/ScheduleStatusBadge";

const LOCKED_STATUSES = new Set(["Approved", "Scheduled", "Published"]);

const labelStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "var(--cds-text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "4px",
  fontWeight: 500,
};

const valueStyle: React.CSSProperties = {
  fontSize: "0.875rem",
  color: "var(--cds-text-primary)",
};

export default function ScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { notify } = useNotification();

  const isApprover = user?.roles?.some((r) => r === "admin" || r === "reviewer") ?? false;

  const [schedule, setSchedule] = useState<PublishSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [editHashtags, setEditHashtags] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await api.get(`/production/schedules/${id}`);
      const s: PublishSchedule = res.data;
      setSchedule(s);
      setEditDate(s.scheduled_date);
      setEditTime(s.scheduled_time);
      setEditCaption(s.caption ?? "");
      setEditHashtags(s.hashtags ?? "");
      setEditNotes(s.notes ?? "");
    } catch {
      setError("Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/production/schedules/${id}`, {
        scheduled_date: editDate,
        scheduled_time: editTime,
        caption: editCaption || null,
        hashtags: editHashtags || null,
        notes: editNotes || null,
      });
      await fetchSchedule();
      setEditMode(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to save";
      notify("error", "Save Failed", msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await api.patch(`/production/schedules/${id}/submit`);
      await fetchSchedule();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to submit";
      notify("error", "Submit Failed", msg);
    }
  };

  const handleApprove = async () => {
    try {
      await api.patch(`/production/schedules/${id}/approve`);
      await fetchSchedule();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to approve";
      notify("error", "Approval Failed", msg);
    }
  };

  const handleReject = async () => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    try {
      await api.patch(`/production/schedules/${id}/reject`, { reason });
      await fetchSchedule();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to reject";
      notify("error", "Rejection Failed", msg);
    }
  };

  const handleAdvance = async (newStatus: "Scheduled" | "Published") => {
    try {
      await api.patch(`/production/schedules/${id}/status`, { status: newStatus });
      await fetchSchedule();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to advance";
      notify("error", "Status Update Failed", msg);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this schedule?")) return;
    try {
      await api.delete(`/production/schedules/${id}`);
      router.push("/production/schedule");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to delete";
      notify("error", "Delete Failed", msg);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <PageLayout maxWidth="md">
          <p style={{ color: "var(--cds-text-secondary)", fontSize: "0.875rem" }}>Loading…</p>
        </PageLayout>
      </>
    );
  }

  if (error || !schedule) {
    return (
      <>
        <Navigation />
        <PageLayout maxWidth="md">
          <InlineNotification kind="error" title={error ?? "Schedule not found"} />
          <Link href="/production/schedule" style={{ marginTop: "8px", display: "inline-block", fontSize: "0.875rem", color: "#0f62fe" }}>
            Back to schedules
          </Link>
        </PageLayout>
      </>
    );
  }

  const isLocked = LOCKED_STATUSES.has(schedule.status);
  const canEdit = !isLocked && (schedule.status === "Draft" || schedule.status === "Rejected");
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <>
      <Navigation />
      <PageLayout maxWidth="md">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
          <Link href="/production/schedule" style={{ color: "#8d8d8d", lineHeight: 0 }}>
            <svg style={{ width: "20px", height: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px" }}>
            <h1 className="cds--type-productive-heading-04">Schedule Detail</h1>
            <ScheduleStatusBadge status={schedule.status} />
          </div>

          {canEdit && (
            <div style={{ display: "flex", alignItems: "center", backgroundColor: "#e0e0e0", borderRadius: "8px", padding: "4px", gap: "4px" }}>
              <Button kind={!editMode ? "secondary" : "ghost"} size="sm" onClick={() => setEditMode(false)}>
                View
              </Button>
              <Button kind={editMode ? "secondary" : "ghost"} size="sm" onClick={() => setEditMode(true)}>
                Edit
              </Button>
            </div>
          )}
        </div>

        {/* Rejection reason */}
        {schedule.rejection_reason && (
          <InlineNotification
            kind="error"
            title="Rejected"
            subtitle={schedule.rejection_reason}
            style={{ marginBottom: "1rem" }}
          />
        )}

        {/* Main card */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Linked content (always read-only) */}
          {(schedule.asset_title || schedule.ideation_title || schedule.script_title) && (
            <div>
              <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--cds-text-primary)", marginBottom: "12px" }}>Linked Content</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {schedule.asset_title && (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {schedule.asset_thumbnail_url && (
                      <img
                        src={storageUrl(schedule.asset_thumbnail_url) ?? ""}
                        alt={schedule.asset_title}
                        style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "4px" }}
                      />
                    )}
                    <div>
                      <p style={labelStyle}>Asset</p>
                      <p style={valueStyle}>{schedule.asset_title}</p>
                    </div>
                  </div>
                )}
                {schedule.ideation_title && (
                  <div>
                    <p style={labelStyle}>Ideation</p>
                    <p style={valueStyle}>{schedule.ideation_title}</p>
                  </div>
                )}
                {schedule.script_title && (
                  <div>
                    <p style={labelStyle}>Script</p>
                    <p style={valueStyle}>{schedule.script_title}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Edit mode */}
          {editMode ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <TextInput
                  id="edit-date"
                  labelText="Scheduled Date"
                  type="date"
                  value={editDate}
                  min={todayStr}
                  onChange={(e) => setEditDate(e.target.value)}
                />
                <TextInput
                  id="edit-time"
                  labelText="Scheduled Time"
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                />
              </div>

              <TextArea
                id="edit-caption"
                labelText="Caption"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                rows={3}
              />

              <TextInput
                id="edit-hashtags"
                labelText="Hashtags"
                value={editHashtags}
                onChange={(e) => setEditHashtags(e.target.value)}
                placeholder="#reels #content"
              />

              <TextArea
                id="edit-notes"
                labelText="Notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={2}
              />

              <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "8px", borderTop: "1px solid #e0e0e0" }}>
                <Button kind="ghost" size="sm" onClick={() => setEditMode(false)}>Cancel</Button>
                <Button kind="primary" size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* View mode */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px" }}>
                <div>
                  <p style={labelStyle}>Scheduled Date</p>
                  <p style={valueStyle}>{schedule.scheduled_date}</p>
                </div>
                <div>
                  <p style={labelStyle}>Scheduled Time</p>
                  <p style={valueStyle}>{schedule.scheduled_time}</p>
                </div>
              </div>

              {schedule.caption && (
                <div>
                  <p style={labelStyle}>Caption</p>
                  <p style={{ ...valueStyle, whiteSpace: "pre-wrap" }}>{schedule.caption}</p>
                </div>
              )}

              {schedule.hashtags && (
                <div>
                  <p style={labelStyle}>Hashtags</p>
                  <p style={{ ...valueStyle, color: "#0f62fe" }}>{schedule.hashtags}</p>
                </div>
              )}

              {schedule.notes && (
                <div>
                  <p style={labelStyle}>Notes</p>
                  <p style={{ ...valueStyle, whiteSpace: "pre-wrap" }}>{schedule.notes}</p>
                </div>
              )}

              {schedule.approved_at && (
                <div>
                  <p style={labelStyle}>Approved At</p>
                  <p style={valueStyle}>{new Date(schedule.approved_at).toLocaleString()}</p>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>
                <div>Created: {new Date(schedule.created_at).toLocaleDateString()}</div>
                <div>Updated: {new Date(schedule.updated_at).toLocaleDateString()}</div>
              </div>
            </>
          )}
        </div>

        {/* Action buttons */}
        {!editMode && (
          <div style={{ marginTop: "1.5rem", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
            {(schedule.status === "Draft" || schedule.status === "Rejected") && (
              <Button kind="primary" size="sm" onClick={handleSubmit}>Submit for Review</Button>
            )}

            {isApprover && schedule.status === "Pending Review" && (
              <>
                <Button kind="primary" size="sm" onClick={handleApprove}>Approve</Button>
                <Button kind="danger" size="sm" onClick={handleReject}>Reject</Button>
              </>
            )}

            {isApprover && schedule.status === "Approved" && (
              <Button kind="primary" size="sm" onClick={() => handleAdvance("Scheduled")}>Mark Scheduled</Button>
            )}

            {isApprover && schedule.status === "Scheduled" && (
              <Button kind="primary" size="sm" onClick={() => handleAdvance("Published")}>Mark Published</Button>
            )}

            {!isLocked && (
              <Button kind="danger--ghost" size="sm" onClick={handleDelete} style={{ marginLeft: "auto" }}>
                Delete
              </Button>
            )}
          </div>
        )}
      </PageLayout>
    </>
  );
}
