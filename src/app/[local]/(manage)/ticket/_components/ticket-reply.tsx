"use client";
import MarkdownInput from "~/app/[local]/(manage)/ticket/_components/markdown-input";
import { Button } from "~/lib/ui/button";
import { useState } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { useTrack } from "~/lib/hooks/use-track";

export default function TicketReply({ ticketId }: { ticketId: string }) {
  const [value, setValue] = useState("");
  const router = useRouter();
  const { track } = useTrack();
  const replyTicketMutation = api.ticket.reply.useMutation({
    onSuccess: () => {
      setValue("");
      router.refresh();
    },
  });

  return (
    <div className="space-y-3">
      <MarkdownInput value={value} onChange={setValue} height={200} />
      <Button
        className="text-right"
        onClick={() => {
          track("ticket-reply-button", {
            ticketId: ticketId,
            content: value,
          });
          void replyTicketMutation.mutateAsync({
            id: ticketId,
            content: value,
          });
        }}
        disabled={value === ""}
        loading={replyTicketMutation.isLoading}
        success={replyTicketMutation.isSuccess}
      >
        回复
      </Button>
    </div>
  );
}
