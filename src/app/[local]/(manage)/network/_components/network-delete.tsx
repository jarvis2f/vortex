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

export default function NetworkDelete({ id }: { id: string }) {
  const deleteMutation = api.network.delete.useMutation();
  const utils = api.useUtils();
  const { track } = useTrack();

  const handleDelete = () => {
    track("network-delete-button", {
      networkId: id,
    });
    void deleteMutation.mutateAsync({ id: id }).then(() => {
      void utils.network.getAll.refetch();
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
          <Trash2Icon className="h-4 w-4 text-red-500" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>你确认要删除这条网络配置吗？</AlertDialogTitle>
          <AlertDialogDescription>
            这个操作不可逆转。将会从系统上将这条网络配置删除，会停止所有的转发，并且删除所有相关的数据。
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
