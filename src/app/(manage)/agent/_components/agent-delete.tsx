"use client";
import { Button } from "~/lib/ui/button";
import { Trash2Icon } from "lucide-react";
import { api } from "~/trpc/react";
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
import { useTrack } from "~/lib/hooks/use-track";

export default function AgentDelete({
  currentAgentId,
}: {
  currentAgentId: string;
}) {
  const deleteMutation = api.agent.delete.useMutation();
  const { track } = useTrack();

  const handleDelete = () => {
    track("agent-delete-button", {
      agentId: currentAgentId,
    });
    void deleteMutation.mutateAsync({ id: currentAgentId }).then(() => {
      window.location.replace("/agent");
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          loading={deleteMutation.isLoading}
          success={deleteMutation.isSuccess}
        >
          <Trash2Icon className="h-5 w-5 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>你确认要删除这台服务器吗？</AlertDialogTitle>
          <AlertDialogDescription>
            这个操作不可逆转。将会从系统上将这台服务器删除，会停止所有的转发，并且删除所有相关的数据。
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
