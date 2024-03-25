import { Logs } from "~/app/[local]/(manage)/admin/log/_components/logs";

export const metadata = {
  title: "服务器 - 日志 - vortex",
};

export default function AgentLogPage({
  params: { agentId },
}: {
  params: { agentId: string };
}) {
  return (
    <div className="p-3">
      <Logs agentId={agentId} />
    </div>
  );
}
