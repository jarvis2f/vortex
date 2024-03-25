import { api } from "~/trpc/server";
import ConfigList from "~/app/[local]/(manage)/admin/config/_components/config-list";
import { GLOBAL_CONFIG_SCHEMA_MAP } from "~/lib/constants/config";

export default async function Config() {
  const configs = await api.system.getAllConfig.query();

  return <ConfigList configs={configs} schemaMap={GLOBAL_CONFIG_SCHEMA_MAP} />;
}
