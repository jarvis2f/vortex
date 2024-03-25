import ForwardTable from "~/app/[local]/(manage)/forward/_components/forward-table";

export const metadata = {
  title: "服务器 - 转发 - vortex",
};

export default function AgentForwardPage({
  params: { agentId },
}: {
  params: { agentId: string };
}) {
  return (
    <div className="p-3">
      <ForwardTable agentId={agentId} />
    </div>
  );
}
