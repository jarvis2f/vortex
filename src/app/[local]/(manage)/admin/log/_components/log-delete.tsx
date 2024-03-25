"use client";
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
import { Button } from "~/lib/ui/button";
import { Trash2Icon } from "lucide-react";
import React from "react";
import { toast } from "~/lib/ui/use-toast";
import { useLogStore } from "~/app/[local]/(manage)/admin/log/store/log-store";
import { useTrack } from "~/lib/hooks/use-track";

export default function LogDelete() {
  const utils = api.useUtils();
  const { params } = useLogStore();
  const deleteLogs = api.log.deleteLogs.useMutation({
    onSuccess: () => {
      toast({
        title: "Deleted successfully",
        variant: "default",
      });
      void utils.log.getLogs.refetch();
    },
  });
  const { track } = useTrack();

  function handleDelete() {
    track("log-delete-button", {});
    void deleteLogs.mutateAsync();
  }

  if (params.agentId && params.agentId !== "") {
    return null;
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="h-8">
          <Trash2Icon className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>你确认要删除所有日志吗？</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>继续</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
