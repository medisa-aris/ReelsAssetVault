import { Tag } from "@carbon/react";
import type { ScheduleStatus } from "@/lib/types";

// Carbon Tag kinds: gray | warm-gray | red | magenta | purple | blue | cyan | teal | green | cool-gray | high-contrast | outline
const TYPE_MAP: Record<ScheduleStatus, "gray" | "warm-gray" | "green" | "blue" | "teal" | "red"> = {
  Draft: "gray",
  "Pending Review": "warm-gray",
  Approved: "green",
  Scheduled: "blue",
  Published: "teal",
  Rejected: "red",
};

interface ScheduleStatusBadgeProps {
  status: ScheduleStatus;
}

export default function ScheduleStatusBadge({ status }: ScheduleStatusBadgeProps) {
  return (
    <Tag type={TYPE_MAP[status] ?? "gray"} size="sm">
      {status}
    </Tag>
  );
}
