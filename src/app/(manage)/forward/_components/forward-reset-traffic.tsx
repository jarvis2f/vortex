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

export default function ForwardResetTraffic({
  trigger,
  forwardId,
}: {
  trigger: ReactNode;
  forwardId: string;
}) {
  const resetUsedTrafficTrafficMutation =
    api.forward.resetUsedTrafficTraffic.useMutation();
  const { track } = useTrack();

  function handleResetUsedTrafficTrafficMutation() {
    track("reset-used-traffic-traffic-button", {
      forwardId: forwardId,
    });
    void resetUsedTrafficTrafficMutation
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
          <AlertDialogTitle>
            你确认要重置这个转发配置的流量吗？
          </AlertDialogTitle>
          <AlertDialogDescription>
            这个操作不可逆转。将会重置已使用的流量。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleResetUsedTrafficTrafficMutation}>
            继续
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
