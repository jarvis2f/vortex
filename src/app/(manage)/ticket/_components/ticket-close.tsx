"use client";
import { Button } from "~/lib/ui/button";
import { api } from "~/trpc/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/lib/ui/alert-dialog";
import { useTrack } from "~/lib/hooks/use-track";

export default function TicketClose({ id }: { id: string }) {
  const closeTicketMutation = api.ticket.close.useMutation();
  const utils = api.useUtils();
  const { track } = useTrack();

  const handleClose = () => {
    track("network-close-button", {
      ticketId: id,
    });
    void closeTicketMutation.mutateAsync({ id: id }).then(() => {
      void utils.ticket.getAll.refetch();
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          loading={closeTicketMutation.isLoading}
          success={closeTicketMutation.isSuccess}
        >
          关闭
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>你确认要关闭这个工单吗？</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleClose}>继续</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
