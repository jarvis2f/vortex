"use client";
import { ScrollArea } from "~/lib/ui/scroll-area";
import AgentList from "~/app/(manage)/agent/_components/agent-list";
import { AgentForm } from "~/app/(manage)/agent/_components/agent-form";
import { Button } from "~/lib/ui/button";
import { PlusIcon } from "lucide-react";
import { type AgentGetAllOutput } from "~/lib/types/trpc";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { hasPermission } from "~/lib/constants/permission";
import { useSession } from "next-auth/react";
import { CSSProperties, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/lib/ui/dialog";
import { Input } from "~/lib/ui/input";

export default function AgentListAside({
  agentId,
  agents,
  className,
  style,
}: {
  agentId: string;
  agents: AgentGetAllOutput;
  className?: string;
  style?: CSSProperties;
}) {
  const [keyword, setKeyword] = useState("");
  agents =
    api.agent.getAll.useQuery(undefined, {
      refetchInterval: 3000,
    }).data ?? agents;

  agents = useMemo(() => {
    if (!keyword) return agents;
    return {
      ONLINE: agents.ONLINE.filter((agent) => agent.name.includes(keyword)),
      OFFLINE: agents.OFFLINE.filter((agent) => agent.name.includes(keyword)),
      UNKNOWN: agents.UNKNOWN.filter((agent) => agent.name.includes(keyword)),
    };
  }, [agents, keyword]);

  const { data: session } = useSession();

  return (
    <div className="fixed h-full" style={style}>
      <Input
        className="mx-auto mt-4 w-[90%]"
        placeholder="搜索服务器"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <ScrollArea className={cn("h-full w-full px-4 pb-12", className)}>
        <AgentList
          title="在线服务器"
          agents={agents.ONLINE}
          agentId={agentId}
        />
        <AgentList
          title="掉线服务器"
          agents={agents.OFFLINE}
          agentId={agentId}
        />
        <AgentList
          title="未知服务器"
          agents={agents.UNKNOWN}
          agentId={agentId}
        />
      </ScrollArea>
      {hasPermission(session!, "page:button:addAgent") && (
        <div className="absolute bottom-0 left-1/2 w-[90%] -translate-x-1/2 transform pb-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">
                <PlusIcon className="mr-2 h-4 w-4" />
                添加服务器
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加服务器</DialogTitle>
                <DialogDescription>
                  点击保存后查看侧边服务器栏。添加中转服务器，保存后会给你一个安装命令，复制到服务器上执行即可。
                </DialogDescription>
              </DialogHeader>
              <AgentForm />
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
