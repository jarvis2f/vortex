"use client";
import { ScrollArea } from "~/lib/ui/scroll-area";
import AgentList from "~/app/[local]/(manage)/agent/_components/agent-list";
import { AgentForm } from "~/app/[local]/(manage)/agent/_components/agent-form";
import { Button } from "~/lib/ui/button";
import { PlusIcon } from "lucide-react";
import { type AgentGetAllOutput } from "~/lib/types/trpc";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { hasPermission } from "~/lib/constants/permission";
import { useSession } from "next-auth/react";
import { type CSSProperties, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/lib/ui/dialog";
import { Input } from "~/lib/ui/input";
import { useTranslations } from "use-intl";

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
  const t = useTranslations("agent-agent-list-aside");
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
        placeholder={t("search_server")}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <ScrollArea className={cn("h-full w-full px-4 pb-12", className)}>
        <AgentList
          title={t("online_servers")}
          agents={agents.ONLINE}
          agentId={agentId}
        />
        <AgentList
          title={t("offline_servers")}
          agents={agents.OFFLINE}
          agentId={agentId}
        />
        <AgentList
          title={t("unknown_servers")}
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
                {t("add_server")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("add_server")}</DialogTitle>
                <DialogDescription>{t("add_tips")}</DialogDescription>
              </DialogHeader>
              <AgentForm />
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
