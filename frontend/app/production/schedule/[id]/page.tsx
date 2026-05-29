"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { PageLayout } from "@/components/PageLayout";
import { useNotification } from "@/components/NotificationProvider";
import { Button, InlineNotification } from "@carbon/react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PublishSchedule } from "@/lib/types";
import { storageUrl } from "@/lib/utils";
import ScheduleStatusBadge from "@/components/ScheduleStatusBadge";

const LOCKED_STATUSES = new Set(["Approved", "Scheduled", "Published"]);

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

  // Edit form state
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
          <p className="text-gray-500">Loading...</p>
        </PageLayout>
      </>
    );
  }

  if (error || !schedule) {
    return (
      <>
        <Navigation />
        <PageLayout maxWidth="md">
          <p className="text-red-500">{error ?? "Schedule not found"}</p>
          <Link href="/production/schedule" className="text-indigo-600 hover:underline text-sm mt-2 block">
            Back to schedules
          </Link>
        </PageLayout>
      </>
    );
  }

  const isLocked = LOCKED_STATUSES.has(schedule.status);
  const canEdit = !isLocked && (schedule.status === "Draft" || schedule.status === "Rejected");

  return (
    <>
      <Navigation />
      <PageLayout maxWidth="md">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/production/schedule" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1 flex items-center gap-3">
          <h1 className="cds--type-productive-heading-04">Schedule Detail</h1>
          <ScheduleStatusBadge status={schedule.status} />
        </div>

        {/* View / Edit toggle */}
        {canEdit && (
          <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
            <Button
              kind={!editMode ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setEditMode(false)}
            >
              View
            </Button>
            <Button
              kind={editMode ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setEditMode(true)}
            >
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
          className="mb-4"
        />
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-6">

        {/* Linked content (always read-only) */}
        {(schedule.asset_title || schedule.ideation_title || schedule.script_title) && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Linked Content</h2>
            <div className="flex flex-col gap-2">
              {schedule.asset_title && (
                <div className="flex items-center gap-3">
                  {schedule.asset_thumbnail_url && (
                    <img
                      src={storageUrl(schedule.asset_thumbnail_url) ?? ""}
                      alt={schedule.asset_title}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Asset</p>
                    <p className="text-sm text-gray-900">{schedule.asset_title}</p>
                  </div>
                </div>
              )}
              {schedule.ideation_title && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Ideation</p>
                  <p className="text-sm text-gray-900">{schedule.ideation_title}</p>
                </div>
              )}
              {schedule.script_title && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Script</p>
                  <p className="text-sm text-gray-900">{schedule.script_title}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Editable fields */}
        {editMode ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                <input
                  type="date"
                  value={editDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Time</label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
              <textarea
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hashtags</label>
              <input
                type="text"
                value={editHashtags}
                onChange={(e) => setEditHashtags(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <Button kind="ghost" size="sm" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button kind="primary" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* View mode */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Scheduled Date</p>
                <p className="text-sm text-gray-900">{schedule.scheduled_date}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Scheduled Time</p>
                <p className="text-sm text-gray-900">{schedule.scheduled_time}</p>
              </div>
            </div>

            {schedule.caption && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Caption</p>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{schedule.caption}</p>
              </div>
            )}

            {schedule.hashtags && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Hashtags</p>
                <p className="text-sm text-indigo-600">{schedule.hashtags}</p>
              </div>
            )}

            {schedule.notes && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{schedule.notes}</p>
              </div>
            )}

            {schedule.approved_at && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Approved At</p>
                <p className="text-sm text-gray-900">
                  {new Date(schedule.approved_at).toLocaleString()}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
              <div>Created: {new Date(schedule.created_at).toLocaleDateString()}</div>
              <div>Updated: {new Date(schedule.updated_at).toLocaleDateString()}</div>
            </div>
          </>
        )}
      </div>

      {/* Action buttons */}
      {!editMode && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {/* Submit (Draft or Rejected) */}
          {(schedule.status === "Draft" || schedule.status === "Rejected") && (
            <Button kind="primary" size="sm" onClick={handleSubmit}>
              Submit for Review
            </Button>
          )}

          {/* Approver actions */}
          {isApprover && schedule.status === "Pending Review" && (
            <>
              <Button kind="primary" size="sm" onClick={handleApprove}>
                Approve
              </Button>
              <Button kind="danger" size="sm" onClick={handleReject}>
                Reject
              </Button>
            </>
          )}

          {isApprover && schedule.status === "Approved" && (
            <Button kind="primary" size="sm" onClick={() => handleAdvance("Scheduled")}>
              Mark Scheduled
            </Button>
          )}

          {isApprover && schedule.status === "Scheduled" && (
            <Button kind="primary" size="sm" onClick={() => handleAdvance("Published")}>
              Mark Published
            </Button>
          )}

          {/* Delete (only unlocked) */}
          {!isLocked && (
            <Button kind="danger--ghost" size="sm" onClick={handleDelete} className="ml-auto">
              Delete
            </Button>
          )}
        </div>
      )}
    </PageLayout>
    </>
  );
}
