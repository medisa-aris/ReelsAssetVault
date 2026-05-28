import { ScheduleStatus } from "@/lib/types";

const STATUS_STYLES: Record<ScheduleStatus, string> = {
  Draft: "bg-gray-100 text-gray-600",
  "Pending Review": "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-700",
  Scheduled: "bg-blue-100 text-blue-700",
  Published: "bg-indigo-100 text-indigo-700",
  Rejected: "bg-red-100 text-red-700",
};

interface ScheduleStatusBadgeProps {
  status: ScheduleStatus;
}

export default function ScheduleStatusBadge({ status }: ScheduleStatusBadgeProps) {
  const cls = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}
