"use client";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/lib/ui/alert-dialog";
import { useContext, useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/lib/ui/button";
import { Input } from "~/lib/ui/input";
import { NetworkContext } from "~/app/[local]/(manage)/network/store/network-store";
import { useStore } from "zustand";
import { useRouter } from "next/navigation";
import { Switch } from "~/lib/ui/switch";
import { Label } from "~/lib/ui/label";
import { SaveIcon } from "lucide-react";
import { useTrack } from "~/lib/hooks/use-track";

export default function NetworkEdit() {
  const { network, nodes, edges } = useStore(useContext(NetworkContext)!);
  const createOrUpdateNetworkMutation = api.network.createOrUpdate.useMutation({
    onSuccess: (data) => {
      router.replace(`/network/${data.id}`);
    },
  });
  const [name, setName] = useState("");
  const [applyToNetwork, setApplyToNetwork] = useState(false);
  const router = useRouter();
  const { track } = useTrack();

  useEffect(() => {
    setName(network?.name ?? "");
  }, [network]);

  function handleEditNetwork() {
    track("network-edit-button", {
      name: name,
    });
    void createOrUpdateNetworkMutation
      .mutateAsync({
        id: network?.id,
        name: name,
        flow: {
          nodes: nodes,
          edges: edges,
        },
        applyToNetwork,
      })
      .then(() => {
        router.refresh();
      });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8 px-1">
          <SaveIcon className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {network ? "更新组网配置" : "保存为新的组网配置"}
          </AlertDialogTitle>
        </AlertDialogHeader>
        <Input
          placeholder="组网名称"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />
        <div className="flex items-center space-x-2">
          <Switch
            id="apply-to-network"
            checked={applyToNetwork}
            onCheckedChange={(c) => setApplyToNetwork(c)}
          />
          <Label htmlFor="apply-to-network">是否应用至网络</Label>
        </div>
        {applyToNetwork && (
          <div className="text-sm text-gray-500">
            选择此选项将会覆盖当前网络配置,请谨慎操作
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <Button
            onClick={handleEditNetwork}
            disabled={name === ""}
            loading={createOrUpdateNetworkMutation.isLoading}
            success={createOrUpdateNetworkMutation.isSuccess}
          >
            保存
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
