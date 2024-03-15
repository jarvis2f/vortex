import { cn } from "~/lib/utils";
import * as React from "react";
import { type TicketStatus } from ".prisma/client";

export default function TicketStatusBadge({
  status,
  className,
}: {
  status: TicketStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        className,
        "text-primary-background rounded bg-primary-foreground px-2 py-1 text-xs",
        status === "REPLIED" && "bg-green-500/80 text-white",
        status === "CLOSED" && "bg-red-500/80 text-white",
      )}
    >
      {status}
    </span>
  );
}
