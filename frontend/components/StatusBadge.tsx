import type { IdeationStatus } from "@/lib/types";

const COLORS: Record<IdeationStatus, string> = {
  Draft: "bg-gray-100 text-gray-600",
  Approved: "bg-green-100 text-green-700",
  "Script Generated": "bg-blue-100 text-blue-700",
  Published: "bg-indigo-100 text-indigo-700",
};

interface StatusBadgeProps {
  status: IdeationStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cls = COLORS[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}
