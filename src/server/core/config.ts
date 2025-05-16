import { db, redis } from "~/server/db";
import { type CONFIG_KEY } from "~/lib/types";
import { CONFIG_DEFAULT_VALUE_MAP } from "~/lib/constants/config";
import { distributeTask } from "~/server/core/agent-task";
import { type JOB_NAME, serverTask } from "~/server/core/task";

export async function saveConfig(
  key: CONFIG_KEY,
  v: unknown,
  relationId = "0",
) {
  let value;
  if (typeof v === "string") {
    try {
      // 尝试解析字符串，看是否是JSON
      JSON.parse(v);
      // 如果能解析，说明已经是JSON字符串，直接使用
      value = v;
    } catch (e) {
      // 不是JSON字符串，按普通字符串处理
      value = v;
    }
  } else if (v instanceof Object) {
    value = JSON.stringify(v);
  } else {
    value = String(v);
  }
  const config = await db.config.upsert({
    where: {
      relationId_key: {
        key,
        relationId,
      },
    },
    update: { value, relationId },
    create: { key, value, relationId },
  });
  if (key.startsWith("AGENT") && key !== "AGENT_GOST_CONFIG") {
    const redisKey: string =
      relationId === "0" ? "agent_config" : `agent_config:${relationId}`;
    await redis.hset(redisKey, { [key]: value });
    await distributeTask({
      agentId: relationId,
      task: {
        type: "config_change",
        id: "",
        key: key,
        value: value,
      },
    });
  }
  if (key.startsWith("SERVER") && key.endsWith("_CRON")) {
    await serverTask.setTime(
      key.substring(0, key.length - 5) as JOB_NAME,
      value,
    );
  }
  return config;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getConfig({
  key,
  defaultValue,
  updateDefaultValue,
  relationId = "0",
}: {
  key: CONFIG_KEY;
  defaultValue?: unknown;
  updateDefaultValue?: boolean;
  relationId?: string;
}) {
  const config = await db.config.findUnique({
    where: {
      relationId_key: {
        key,
        relationId,
      },
    },
  });
  if (config?.value) {
    try {
      return JSON.parse(config.value);
    } catch (e) {
      return config.value;
    }
  }
  if (defaultValue === undefined) {
    defaultValue = CONFIG_DEFAULT_VALUE_MAP[key];
  }
  if (defaultValue !== undefined && updateDefaultValue) {
    await saveConfig(key, defaultValue, relationId);
  }
  return defaultValue;
}
