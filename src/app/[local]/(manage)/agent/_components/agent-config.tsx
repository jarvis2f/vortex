import ConfigList from "~/app/[local]/(manage)/admin/config/_components/config-list";
import { AGENT_CONFIG_SCHEMA_MAP } from "~/lib/constants/config";
import { api } from "~/trpc/server";

export default async function AgentConfig({ id }: { id: string }) {
  const configs = await api.system.getAllConfig.query({
    relationId: id,
  });

  return (
    <>
      {/*TODO: 服务器基本信息设置 */}
      <ConfigList
        schemaMap={AGENT_CONFIG_SCHEMA_MAP}
        configs={configs ?? []}
        relationId={id}
      />
    </>
  );
}
