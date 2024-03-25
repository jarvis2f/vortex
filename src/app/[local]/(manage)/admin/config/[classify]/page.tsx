import { api } from "~/trpc/server";
import ConfigList from "~/app/[local]/(manage)/admin/config/_components/config-list";
import { GLOBAL_CONFIG_SCHEMA_MAP } from "~/lib/constants/config";
import { type CONFIG_KEY } from "~/lib/types";

type FilterKeys<T, K extends keyof T> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};

const classifyConfigKeys: Record<string, CONFIG_KEY[]> = {
  appearance: [
    "ENABLE_REGISTER",
    "ANNOUNCEMENT",
    "RECHARGE_MIN_AMOUNT",
    "WITHDRAW_MIN_AMOUNT",
  ],
  log: ["LOG_RETENTION_PERIOD", "LOG_RETENTION_LEVEL"],
  agent: [
    "SERVER_AGENT_STAT_JOB_CRON",
    "SERVER_AGENT_STATUS_JOB_CRON",
    "SERVER_AGENT_LOG_JOB_CRON",
    "SERVER_AGENT_TRAFFIC_JOB_CRON",
    "SERVER_AGENT_STAT_INTERVAL",
    "TRAFFIC_PRICE",
  ],
};

export default async function ConfigClassifyPage({
  params: { classify },
}: {
  params: { classify: string };
}) {
  const configs = await api.system.getAllConfig.query();
  const configKeys = classifyConfigKeys[classify];
  const schemaMap = Object.fromEntries(
    Object.entries(GLOBAL_CONFIG_SCHEMA_MAP).filter(([key]) =>
      configKeys!.includes(key as CONFIG_KEY),
    ),
  ) as FilterKeys<typeof GLOBAL_CONFIG_SCHEMA_MAP, CONFIG_KEY>;

  return <ConfigList configs={configs} schemaMap={schemaMap} />;
}
