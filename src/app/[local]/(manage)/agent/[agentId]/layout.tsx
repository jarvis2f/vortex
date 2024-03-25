import { api } from "~/trpc/server";
import AgentResizableLayout from "~/app/[local]/(manage)/agent/_components/agent-resizable-layout";
import { type ReactNode } from "react";
import AgentMenu from "~/app/[local]/(manage)/agent/_components/agent-menu";

export const metadata = {
  title: "服务器 - vortex",
};

export default async function AgentLayout({
  children,
  params: { agentId },
}: {
  children: ReactNode;
  params: { agentId: string };
}) {
  const agents = await api.agent.getAll.query(undefined);
  let agent;
  if (agentId !== undefined) {
    agent = Object.values(agents)
      .flat()
      .find((agent) => agent.id === agentId);
  } else {
    if (agents.ONLINE.length > 0) {
      agent = agents.ONLINE[0];
    } else if (agents.OFFLINE.length > 0) {
      agent = agents.OFFLINE[0];
    } else if (agents.UNKNOWN.length > 0) {
      agent = agents.UNKNOWN[0];
    }
  }

  if (agentId === undefined && agent !== undefined) {
    agentId = agent.id;
  }

  return (
    <AgentResizableLayout agents={agents} agentId={agentId}>
      <div className="flex min-h-screen w-full flex-1 flex-col">
        {agent && <AgentMenu agent={agent} />}
        {children}
      </div>
    </AgentResizableLayout>
  );
}
