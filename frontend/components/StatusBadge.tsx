import { Tag } from "@carbon/react";
import type { IdeationStatus } from "@/lib/types";

const TYPE_MAP: Record<IdeationStatus, "gray" | "green" | "blue" | "teal"> = {
  Draft: "gray",
  Approved: "green",
  "Script Generated": "blue",
  Published: "teal",
};

interface StatusBadgeProps {
  status: IdeationStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Tag type={TYPE_MAP[status] ?? "gray"} size="sm">
      {status}
    </Tag>
  );
}
