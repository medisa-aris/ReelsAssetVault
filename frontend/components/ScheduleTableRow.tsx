"use client";

import Link from "next/link";
import { PublishSchedule } from "@/lib/types";
import ScheduleStatusBadge from "@/components/ScheduleStatusBadge";
import { api } from "@/lib/api";
import { storageUrl } from "@/lib/utils";

interface ScheduleTableRowProps {
  schedule: PublishSchedule;
  isApprover: boolean;
  onStatusUpdate: () => void;
}

export default function ScheduleTableRow({ schedule, isApprover, onStatusUpdate }: ScheduleTableRowProps) {
  const handleSubmit = async () => {
    try {
      await api.patch(`/production/schedules/${schedule.id}/submit`);
      onStatusUpdate();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to submit";
      alert(msg);
    }
  };

  const handleApprove = async () => {
    try {
      await api.patch(`/production/schedules/${schedule.id}/approve`);
      onStatusUpdate();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to approve";
      alert(msg);
    }
  };

  const handleReject = async () => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    try {
      await api.patch(`/production/schedules/${schedule.id}/reject`, { reason });
      onStatusUpdate();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to reject";
      alert(msg);
    }
  };

  const captionPreview = schedule.caption
    ? schedule.caption.length > 60
      ? schedule.caption.slice(0, 60) + "..."
      : schedule.caption
    : "-";

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Thumbnail */}
      <td className="px-4 py-3 w-14">
        {schedule.asset_thumbnail_url ? (
          <img
            src={storageUrl(schedule.asset_thumbnail_url) ?? ""}
            alt={schedule.asset_title ?? ""}
            className="w-12 h-12 object-cover rounded"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
            No img
          </div>
        )}
      </td>

      {/* Caption + ideation */}
      <td className="px-4 py-3">
        <p className="text-sm text-gray-900">{captionPreview}</p>
        {schedule.ideation_title && (
          <p className="text-xs text-gray-500 mt-0.5">Ideation: {schedule.ideation_title}</p>
        )}
        {schedule.asset_title && (
          <p className="text-xs text-gray-500">Asset: {schedule.asset_title}</p>
        )}
      </td>

      {/* Scheduled date */}
      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
        {schedule.scheduled_date}
        <span className="block text-xs text-gray-400">{schedule.scheduled_time}</span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <ScheduleStatusBadge status={schedule.status} />
        {schedule.rejection_reason && (
          <p className="text-xs text-red-500 mt-1 max-w-xs truncate" title={schedule.rejection_reason}>
            {schedule.rejection_reason}
          </p>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Link
            href={`/production/schedule/${schedule.id}`}
            className="text-xs text-indigo-600 hover:underline font-medium"
          >
            View
          </Link>

          {(schedule.status === "Draft" || schedule.status === "Rejected") && (
            <button
              onClick={handleSubmit}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Submit
            </button>
          )}

          {schedule.status === "Pending Review" && isApprover && (
            <>
              <button
                onClick={handleApprove}
                className="text-xs text-green-600 hover:underline font-medium"
              >
                Approve
              </button>
              <button
                onClick={handleReject}
                className="text-xs text-red-600 hover:underline font-medium"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
