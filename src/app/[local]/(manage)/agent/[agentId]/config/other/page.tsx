import ConfigList from "~/app/[local]/(manage)/admin/config/_components/config-list";
import { AGENT_CONFIG_SCHEMA_MAP } from "~/lib/constants/config";
import { api } from "~/trpc/server";

export const metadata = {
  title: "服务器 - 其它设置 - vortex",
};

export default async function AgentConfig({
  params: { agentId },
}: {
  params: { agentId: string };
}) {
  const configs = await api.system.getAllConfig.query({
    relationId: agentId,
  });

  return (
    <div className="p-3">
      <ConfigList
        schemaMap={AGENT_CONFIG_SCHEMA_MAP}
        configs={configs ?? []}
        relationId={agentId}
      />
    </div>
  );
}
