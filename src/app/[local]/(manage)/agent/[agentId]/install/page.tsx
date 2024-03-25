import AgentInstall from "~/app/[local]/(manage)/agent/_components/agent-install";

export const metadata = {
  title: "服务器 - 安装 - vortex",
};

export default function AgentInstallPage({
  params: { agentId },
}: {
  params: { agentId: string };
}) {
  return <AgentInstall agentId={agentId} />;
}
