"use client";
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
import { type ReactNode, useState } from "react";
import { api } from "~/trpc/react";
import { Textarea } from "~/lib/ui/textarea";
import { useTrack } from "~/lib/hooks/use-track";

export default function ForwardModifyRemark({
  trigger,
  forwardId,
  remark: originRemark,
}: {
  trigger: ReactNode;
  forwardId: string;
  remark: string | null;
}) {
  const [remark, setRemark] = useState(originRemark ?? "");
  const updateRemarkMutation = api.forward.updateRemark.useMutation();
  const { track } = useTrack();

  function handleUpdateRemark() {
    track("forward-update-remark-button", {
      forwardId: forwardId,
      remark: remark,
    });
    void updateRemarkMutation
      .mutateAsync({
        id: forwardId,
        remark: remark,
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
          <AlertDialogTitle>更新转发备注</AlertDialogTitle>
          <Textarea
            placeholder="在这里输入你的备注"
            value={remark}
            onChange={(e) => setRemark(e.currentTarget.value)}
          />
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpdateRemark}>
            保存
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
