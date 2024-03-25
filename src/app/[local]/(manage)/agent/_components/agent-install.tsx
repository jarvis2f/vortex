"use client";
import { Button } from "~/lib/ui/button";
import { CopyIcon, Terminal } from "lucide-react";
import { cn, copyToClipboard } from "~/lib/utils";
import { api } from "~/trpc/react";
import { useState } from "react";
import { Switch } from "~/lib/ui/switch";
import { Label } from "~/lib/ui/label";
import { useTrack } from "~/lib/hooks/use-track";

export default function AgentInstall({ agentId }: { agentId: string }) {
  const [alpha, setAlpha] = useState(false);
  const {
    data: installInfo,
    isLoading,
    refetch,
  } = api.agent.getInstallInfo.useQuery({
    id: agentId,
    alpha,
  });
  const refreshKeyMutation = api.agent.refreshKey.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });
  const { track } = useTrack();

  function handleRefreshKey() {
    track("agent-refresh-key-button", {
      agentId: agentId,
    });
    void refreshKeyMutation.mutate({ id: agentId });
  }

  return (
    <div className="flex w-full flex-col justify-center p-4">
      <h1 className="mb-4 text-2xl font-bold">安装</h1>
      <div className="text-md mb-4">
        <li className="ml-8 list-disc">复制下方命令进行安装</li>
        <li className="ml-8 list-disc">安装完成后，服务器状态将会修改</li>
        <li className="ml-8 list-disc">
          可以通过日志页面查看安装情况，成功将会看到一条
          <code className="mx-1 rounded border px-2 text-accent-foreground">
            agent started successfully
          </code>
          的日志
        </li>
        <li className="ml-8 list-disc">
          如果安装命令泄露，可以点击
          <Button
            variant="secondary"
            size="sm"
            className="ml-3"
            onClick={() => handleRefreshKey()}
          >
            更新Key
          </Button>
        </li>
      </div>
      {process.env.NODE_ENV !== "production" && (
        <div className="mb-4 flex items-center gap-1">
          <Switch checked={alpha} onCheckedChange={setAlpha} id="alpha" />
          <Label htmlFor="alpha">Alpha版本</Label>
        </div>
      )}
      <Command
        command={installInfo?.installShell ?? ""}
        isLoading={isLoading}
      />
      <h1 className="mb-4 mt-8 text-2xl font-bold">卸载</h1>
      <div className="text-md mb-4">
        <li className="ml-8 list-disc">复制下方命令进行卸载</li>
        <li className="ml-8 list-disc text-red-500">
          请在安装目录下执行，卸载后会删除所有配置和安装目录下的文件
        </li>
      </div>
      <Command command={installInfo?.uninstallShell ?? ""} isLoading={false} />
    </div>
  );
}

function Command({
  command,
  isLoading,
}: {
  command: string;
  isLoading: boolean;
}) {
  function handleCopy() {
    copyToClipboard(command);
  }

  return (
    <div className="flex w-full items-center rounded border bg-gray-200 p-4 shadow-sm dark:bg-gray-500">
      <div className="flex w-full overflow-x-hidden rounded border bg-white py-2 dark:bg-accent">
        <div className="ml-3 flex w-6 select-none items-center text-right">
          <Terminal className="h-5 w-5" />
        </div>
        <span
          className={cn(
            "ml-3 w-[95%] min-w-[95%] overflow-x-scroll text-sm",
            isLoading && "animate-pulse bg-slate-200",
          )}
        >
          {command}
        </span>
      </div>
      <Button
        className="ml-4 flex h-8 w-8 min-w-8 p-0"
        onClick={() => handleCopy()}
      >
        <CopyIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
