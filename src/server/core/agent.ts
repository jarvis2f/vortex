import { env } from "~/env";
import {
  type AgentInfo,
  type AgentStatRecord,
  type ConnectConfig,
  type InstallResponse,
} from "~/lib/types/agent";
import globalLogger from "~/server/logger";
import { db, redis } from "~/server/db";
import { type JsonObject } from "@prisma/client/runtime/library";
import { $Enums, type Forward, Prisma } from ".prisma/client";
import { getConfig } from "~/server/core/config";
import { GO_LEVEL_2_PINO_LEVEL } from "~/lib/constants/log-level";
import { CONFIG_DEFAULT_VALUE_MAP, CONFIG_KEYS } from "~/lib/constants/config";
import { type CONFIG_KEY } from "~/lib/types";
import { encrypt, uuid, validateSignature } from "~/lib/utils";
import { serverTask } from "~/server/core/task";
import { TRPCError } from "@trpc/server";
import Gost from "~/server/core/gost";
import crypto from "crypto";
import { saveForwardTraffic } from "~/server/core/forward";
import {
  distributeTask,
  getTaskResult,
  subscribeTaskResult,
} from "~/server/core/agent-task";
import AgentStatus = $Enums.AgentStatus;
import AgentStatCreateManyInput = Prisma.AgentStatCreateManyInput;

const logger = globalLogger.child({ module: "agent" });

export async function init() {
  await handleAcl();
  await handleSetConfig();
  if (env.JOB_ENABLED) void serverTask.startJobs();
  void subscribeTaskResult();
}

export async function handleInstall(
  id: string,
  key: string,
  signature: string,
): Promise<InstallResponse> {
  logger.info(
    `Installing agent ${id} with key ${key} and signature ${signature}`,
  );
  const agent = await db.agent.findUnique({ where: { id } });
  if (!agent) {
    throw new Error(`Agent ${id} not found`);
  }
  let connectConfig = agent.connectConfig as unknown as ConnectConfig;
  if (!connectConfig.serverPrivateKey || !connectConfig.serverPublicKey) {
    throw new Error(`Agent ${id} connect config not found`);
  }
  const ecdh = crypto.createECDH("prime256v1");
  ecdh.setPrivateKey(Buffer.from(connectConfig.serverPrivateKey, "hex"));
  const sharedSecret = ecdh.computeSecret(key, "hex", "hex");
  if (
    !(await validateSignature({
      payload: { id, key },
      signature,
      secret: sharedSecret,
    }))
  ) {
    throw new Error("Signature invalid");
  }
  if (connectConfig.connectUsername) {
    await redis.acl("DELUSER", connectConfig.connectUsername);
  }
  const redisUsername = `node-${id}-${uuid()}`;
  const redisPassword = crypto.randomBytes(16).toString("hex");
  await redis.call(
    "ACL",
    "SETUSER",
    redisUsername,
    "on",
    "-@all",
    "+hget",
    "+lpush",
    "+@pubsub",
    "+ping",
    "~*",
    `&agent_task_result_${id}`,
    `&agent_task_${id}`,
    `>${redisPassword}`,
  );
  connectConfig = {
    ...connectConfig,
    secret: sharedSecret,
    connectUsername: redisUsername,
    connectPassword: redisPassword,
  };
  await db.agent.update({
    where: { id },
    data: {
      connectConfig: connectConfig as unknown as JsonObject,
      lastReport: new Date(),
      status: AgentStatus.ONLINE,
    },
  });
  let addr = env.AGENT_REDIS_URL ?? env.REDIS_URL;
  if (addr.startsWith("redis://")) {
    addr = addr.slice(8);
  }
  const link = {
    addr: addr,
    username: redisUsername,
    password: redisPassword,
    db: env.REDIS_DB ?? 0,
  };
  handleAfterOnline(id);
  return { link: encrypt({ data: link, key: sharedSecret }) };
}

export function handleAfterOnline(agentId: string) {
  void (async () => {
    let time = 0;
    while (time < 5) {
      if (await checkAgentOnline(agentId, 3000, false)) {
        await (await Gost(agentId)).setObserver();
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
      time++;
    }
  })();
}

export async function handleStat() {
  const statInterval: number = await getConfig({
    key: "SERVER_AGENT_STAT_INTERVAL",
  });
  const keys = await redis.keys(`agent_status:*`);
  for (const key of keys) {
    const agentId = key.slice(13);
    const agent = await db.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      logger.warn(`handle status fail. Agent ${agentId} not found`);
      continue;
    }

    const lastStatTime = await db.agentStat
      .findFirst({
        where: { agentId },
        orderBy: { time: "desc" },
      })
      .then((stat) => stat?.time.getTime() ?? 0);

    const agentInfo: AgentInfo = (agent.info ?? ({} as AgentInfo)) as AgentInfo;
    const statList: AgentStatCreateManyInput[] = [];

    const len = await redis.llen(key);
    const statJsonList: string[] = [];
    if (len <= 20) {
      statJsonList.push((await redis.rpop(key))!);
    } else {
      const l = await redis.rpop(key, len - 20);
      if (l) statJsonList.push(...l);
    }
    for (const statJson of statJsonList) {
      const stat = JSON.parse(statJson);
      const time = stat.time as number;
      if (stat.info) {
        const host = stat.info.host;
        if (host) {
          agentInfo.platform = host.platform;
          agentInfo.uptime = host.uptime;
          agentInfo.bootTime = host.bootTime;
          agentInfo.platformVersion = host.platformVersion;
          agentInfo.kernelVersion = host.kernelVersion;
          agentInfo.kernelArch = host.kernelArch;
        }
        const cpu = stat.info.cpu;
        if (cpu && cpu.length > 0) {
          agentInfo.cpu = {
            model: cpu[0].modelName,
            cores: cpu[0].cores,
            speed: cpu[0].mhz,
          };
        }
        const ip = stat.info.ip;
        if (ip) {
          agentInfo.ip = {
            ipv4: ip.ipv4,
            ipv6: ip.ipv6,
            country: ip.country,
          };
        }
        agentInfo.version = stat.info.version;
      }
      const stats = stat.stats;
      if (stats) {
        if (stats.memory) {
          agentInfo.memory = {
            total: stats.memory.total,
          };
        }
        if (stats.network) {
          agentInfo.network = {
            totalDownload: stats.network.inTransfer,
            totalUpload: stats.network.outTransfer,
          };
        }

        if (time - lastStatTime > statInterval) {
          const statInput: AgentStatCreateManyInput = {
            agentId,
            time: new Date(time),
            stat: convertStat(statJson) as unknown as JsonObject,
          };
          statList.push(statInput);
        }
      }
    }

    await db.agent.update({
      where: { id: agentId },
      data: {
        info: agentInfo as unknown as JsonObject,
      },
    });

    if (statList.length > 0) {
      await db.agentStat.createMany({ data: statList });
    }
  }
}

export async function handleStatus() {
  const agents = await db.agent.findMany({
    where: {
      deleted: false,
      status: {
        not: AgentStatus.UNKNOWN,
      },
    },
  });
  for (const agent of agents) {
    const lastReport = await getAgentLastReport(agent.id);
    const helloOnline = await checkAgentOnline(agent.id);
    logger.debug(
      `Agent ${agent.id} hello return: ${helloOnline ? "online" : "offline"}`,
    );
    const status = helloOnline ? AgentStatus.ONLINE : AgentStatus.OFFLINE;
    const agentUpdateInput: Prisma.AgentUpdateInput = {};
    if (agent.status !== status) {
      agentUpdateInput.status = status;
    }
    if (lastReport != 0 && lastReport !== agent.lastReport?.getTime()) {
      agentUpdateInput.lastReport = new Date(lastReport);
    }
    if (Object.keys(agentUpdateInput).length !== 0) {
      await db.agent.update({
        where: { id: agent.id },
        data: agentUpdateInput,
      });
    }
  }
}

export async function handleLog() {
  const keys = await redis.keys(`agent_log:*`);
  for (const key of keys) {
    const agentId = key.slice(10);
    const agent = await db.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      logger.warn(`handle log fail. Agent ${agentId} not found`);
      continue;
    }

    const len = await redis.llen(key);
    if (len === 0) continue;

    const logList: Prisma.LogCreateManyInput[] = [];
    const logJsonList = await redis.rpop(key, len);
    for (const logJson of logJsonList!) {
      const log = JSON.parse(logJson);
      log.module = `agent/${agentId}`;
      log.ts = log.ts * 1000;
      const level = GO_LEVEL_2_PINO_LEVEL[log.level] ?? 10;
      const logInput: Prisma.LogCreateManyInput = {
        time: new Date(log.ts as number),
        level: level,
        message: log,
      };
      logList.push(logInput);
    }
    await db.log.createMany({ data: logList });
  }
}

export async function handleAcl() {
  const agents = await db.agent.findMany({
    where: {
      status: AgentStatus.ONLINE,
      deleted: false,
    },
  });

  for (const agent of agents) {
    const connectConfig = agent.connectConfig as unknown as ConnectConfig;
    if (!connectConfig.connectUsername || !connectConfig.connectPassword) {
      continue;
    }
    const acl = await redis.acl("GETUSER", connectConfig.connectUsername);
    if (acl === null) {
      await redis.call(
        "ACL",
        "SETUSER",
        connectConfig.connectUsername,
        "on",
        "-@all",
        "+hget",
        "+lpush",
        "+@pubsub",
        "+ping",
        "~*",
        `&agent_task_result_${agent.id}`,
        `&agent_task_${agent.id}`,
        `>${connectConfig.connectPassword}`,
      );
    }
  }
}

export async function handleSetConfig() {
  const agents = await db.agent.findMany({
    where: {
      deleted: false,
    },
  });

  for (const agent of agents) {
    const configs = await db.config.findMany({
      where: {
        relationId: agent.id,
      },
    });

    const configMap: Partial<Record<CONFIG_KEY, string | boolean | number>> =
      {};

    CONFIG_KEYS.forEach((key) => {
      if (!key.startsWith("AGENT") || key === "AGENT_GOST_CONFIG") {
        return;
      }
      const config = configs.find((config) => config.key === key);
      const configKey = key as CONFIG_KEY;
      const configValue = config?.value ?? CONFIG_DEFAULT_VALUE_MAP[configKey];
      if (configValue !== undefined && configValue !== null) {
        configMap[configKey] =
          typeof configValue === "object"
            ? JSON.stringify(configValue)
            : configValue;
      }
    });

    await redis.hset(`agent_config:${agent.id}`, configMap);
  }
}

interface Traffic {
  download: number;
  upload: number;
}

const pattern = /\/\* (UPLOAD|DOWNLOAD)(?:-UDP)? ([0-9]+)->/;

export async function handleTraffic() {
  const keys = await redis.keys(`agent_traffic:*`);
  for (const key of keys) {
    const agentId = key.slice(14);
    const agent = await db.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      logger.warn(`handle traffic fail. Agent ${agentId} not found`);
      continue;
    }

    const len = await redis.llen(key);
    if (len === 0) continue;
    const portForwards: Record<number, Forward> = {};
    const idForwards: Record<string, Forward> = {};
    await db.forward
      .findMany({
        where: {
          agentId,
          deleted: false,
        },
      })
      .then((forwards) => {
        forwards.forEach((forward) => {
          portForwards[forward.agentPort] = forward;
          idForwards[forward.id] = forward;
        });
      });
    const latestTraffic: Record<
      string,
      {
        time: number;
        traffic: Traffic;
      }
    > = {};
    const forwardTrafficList: Record<
      string,
      Prisma.ForwardTrafficCreateManyInput[]
    > = {};

    const trafficJsonList = await redis.rpop(key, len);
    for (const trafficJson of trafficJsonList!) {
      const { time, traffic: trafficEncoded } = JSON.parse(trafficJson);
      const traffic = Buffer.from(
        trafficEncoded as string,
        "base64",
      ).toString();
      const traffics: Record<number, Traffic> = {};

      for (const line of traffic.split("\n")) {
        const match = line.match(pattern);
        if (match && match.length > 2 && /^\d+$/.test(match[2]!)) {
          const port_num = parseInt(match[2]!);
          if (!traffics[port_num]) {
            traffics[port_num] = { download: 0, upload: 0 };
          }
          const trafficType = match[1]!.toLowerCase() as keyof Traffic;
          // 按空格分割，并移除所有空字符串
          const trafficValue = line.split(" ").filter((s) => s)[1]!;
          traffics[port_num]![trafficType] += parseInt(trafficValue);
        }
      }

      for (const [port_num, traffic] of Object.entries(traffics)) {
        const forward = portForwards[parseInt(port_num)];
        if (!forward) {
          logger.warn(
            `handle traffic fail. Forward ${agentId}:${port_num} not found`,
          );
          continue;
        }

        if (
          !latestTraffic[forward.id] ||
          latestTraffic[forward.id]!.time < time
        ) {
          latestTraffic[forward.id] = {
            time,
            traffic: traffic,
          };
        }
      }
    }

    for (const [forwardId, trafficWithTime] of Object.entries(latestTraffic)) {
      const traffic = trafficWithTime.traffic;
      const forward = idForwards[forwardId]!;
      if (
        traffic.download === forward.download &&
        traffic.upload === forward.upload
      ) {
        continue;
      }
      const forwardTrafficInput: Prisma.ForwardTrafficCreateManyInput = {
        forwardId: forwardId,
        time: new Date(trafficWithTime.time),
        download: traffic.download - forward.download,
        upload: traffic.upload - forward.upload,
      };
      forwardTrafficList[forwardId] = forwardTrafficList[forwardId] ?? [];
      forwardTrafficList[forwardId]!.push(forwardTrafficInput);
      await db.forward.update({
        where: { id: forwardId },
        data: {
          download: traffic.download,
          upload: traffic.upload,
          usedTraffic: traffic.download + traffic.upload,
        },
      });
    }

    for (const [forwardId, traffics] of Object.entries(forwardTrafficList)) {
      await saveForwardTraffic({ forwardId, traffics });
    }
  }
}

export async function checkAgentOnline(
  agentId: string,
  timeout = 2000,
  mem = true,
) {
  const taskId = await distributeTask({
    agentId,
    task: {
      id: "",
      type: "hello",
      mem,
    },
  });
  return await getTaskResult({ taskId, timeout: timeout })
    .then((result) => result.success)
    .catch(() => false);
}

export async function getAgentLastReport(agentId: string) {
  const latestStats = await redis.lrange(`agent_status:${agentId}`, 0, 0);
  let lastReport = 0;
  if (latestStats.length !== 0) {
    const latestStat = JSON.parse(latestStats[0]!);
    lastReport = latestStat.time;
  }
  const latestLogs = await redis.lrange(`agent_log:${agentId}`, 0, 0);
  if (latestLogs.length !== 0) {
    const latestLog = JSON.parse(latestLogs[0]!);
    lastReport = Math.max(lastReport, latestLog.ts * 1000);
  }
  return lastReport;
}

//<-----------------------------convert---------------------------------->

export function convertStats(statsJsonList: string[]): AgentStatRecord[] {
  return statsJsonList.map(convertStat);
}

export function convertStat(statsJson: string): AgentStatRecord {
  const { stats, time } = JSON.parse(statsJson);
  const cpu = stats.cpu;
  const memory = stats.memory;
  const network = stats.network;
  return {
    cpu: {
      percent: Number(cpu[0] ?? 0),
    },
    memory: {
      used: Number(memory?.used ?? 0),
    },
    network: {
      downloadSpeed: Number(network?.inSpeed ?? 0),
      uploadSpeed: Number(network?.outSpeed ?? 0),
      totalDownload: Number(network?.inTransfer ?? 0),
      totalUpload: Number(network?.outTransfer ?? 0),
    },
    time: time,
  };
}

//<-----------------------------search---------------------------------->

export async function getAgentMust(id: string) {
  const agent = await db.agent.findUnique({
    where: { id: id, deleted: false },
  });
  if (!agent) {
    throw new TRPCError({
      message: `Agent ${id} not found`,
      code: "NOT_FOUND",
    });
  }
  return agent;
}
