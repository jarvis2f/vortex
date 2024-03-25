"use client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/lib/ui/alert-dialog";
import { type ReactNode } from "react";
import { api } from "~/trpc/react";
import { useTrack } from "~/lib/hooks/use-track";

export default function ForwardDelete({
  trigger,
  forwardId,
}: {
  trigger: ReactNode;
  forwardId: string;
}) {
  const utils = api.useUtils();
  const deleteMutation = api.forward.delete.useMutation({
    onSuccess: (data) => {
      if (data.result.success) {
        void utils.forward.getAll.refetch();
      }
    },
  });
  const { track } = useTrack();

  function handleDelete() {
    track("forward-delete-button", {
      forwardId: forwardId,
    });
    void deleteMutation
      .mutateAsync({
        id: forwardId,
      })
      .then(() => {
        window.location.reload();
      });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>你确认要删除这个转发配置吗？</AlertDialogTitle>
          <AlertDialogDescription>
            这个操作不可逆转。将会停止转发，并且删除所有相关的数据。如果这个转发是通过组网创建的，你应该去组网页面删除整个组网。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>继续</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
