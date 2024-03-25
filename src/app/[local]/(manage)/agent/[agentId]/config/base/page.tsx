import { AgentForm } from "~/app/[local]/(manage)/agent/_components/agent-form";
import { api } from "~/trpc/server";

export const metadata = {
  title: "服务器 - 基础信息 - vortex",
};
export default async function AgentConfigBasePage({
  params: { agentId },
}: {
  params: { agentId: string };
}) {
  const agent = await api.agent.getOne.query({ id: agentId });
  return (
    <div className="ml-10 w-1/3">
      <AgentForm agent={agent} />
    </div>
  );
}
