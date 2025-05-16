import { z } from "zod";
import {
  type Forward,
  ForwardMethod,
  ForwardStatus,
  ForwardTargetType,
  type Prisma,
} from ".prisma/client";
import { db, redis } from "~/server/db";
import Gost from "~/server/core/gost";
import Realm from "~/server/core/realm";
import { distributeTask, getTaskResult } from "~/server/core/agent-task";
import type { AgentInfo } from "~/lib/types/agent";
import { BalanceLogType, BalanceType } from "@prisma/client";
import { updateUserWallet } from "~/server/core/user";
import { getConfig } from "~/server/core/config";
import globalLogger from "~/server/logger";
import { trafficPriceSchema } from "~/lib/types/zod-schema";
import {
  type BYTE_UNITS,
  convertBytes,
  convertBytesToBestUnit,
} from "~/lib/utils";
import { getAgentMust } from "~/server/core/agent";
import { deleteNetwork } from "~/server/core/network";

const logger = globalLogger.child({ module: "forward" });
export const createForwardSchema = z.object({
  method: z.nativeEnum(ForwardMethod),
  options: z.any().optional(),
  agentPort: z.number().optional(),
  targetPort: z.number(),
  target: z.string(),
  targetType: z.nativeEnum(ForwardTargetType).optional(),
  remark: z.string().optional(),
  agentId: z.string(),
});

export async function createForward({
  params,
  userId,
  start = true,
}: {
  params: z.infer<typeof createForwardSchema>;
  userId: string;
  start?: boolean;
}) {
  const { method, agentPort, targetPort, target, targetType, agentId } = params;
  const options = params.options;
  if (
    agentPort &&
    (await db.forward.count({
      where: {
        agentId,
        agentPort: Number(agentPort),
        status: ForwardStatus.RUNNING,
      },
    }))
  ) {
    throw new Error("端口被占用");
  }
  const forward = await db.forward.create({
    data: {
      method: method,
      options: options,
      targetPort: Number(targetPort),
      target: target,
      targetType: targetType ?? ForwardTargetType.EXTERNAL,
      agentPort: Number(agentPort ?? 0),
      createdBy: {
        connect: {
          id: userId,
        },
      },
      agent: {
        connect: {
          id: agentId,
        },
      },
    },
  });
  return {
    forward,
    result: start
      ? await startForward({ forward })
      : {
          success: true,
        },
  };
}

export async function deleteForward(id: string) {
  const forward = await getForwardMust(id);
  if (forward.method === ForwardMethod.GOST) {
    const gost = await Gost(forward.agentId);
    await gost.removeForward(forward);
    forward.options = gost.config as any;
  }
  if (forward.method === ForwardMethod.REALM) {
    const realm = await Realm(forward.agentId);
    await realm.removeForward(forward);
    forward.options = realm.config as any;
  }
  if (
    forward.status === ForwardStatus.CREATED ||
    forward.status === ForwardStatus.CREATED_FAILED
  ) {
    await db.forward.update({
      where: {
        id,
      },
      data: {
        deleted: true,
      },
    });
    return {
      forward,
      result: {
        success: true,
      },
    };
  }
  return {
    forward,
    result: await stopForward({ forward }),
  };
}

export async function startForward({ forward }: { forward: Forward }) {
  let options: any = forward.options;
  const { method, agentPort, targetPort, agentId } = forward;
  let target = forward.target;
  if (forward.targetType === ForwardTargetType.AGENT) {
    const targetAgent = await db.agent.findUnique({
      where: {
        id: target,
      },
    });
    if (!targetAgent) {
      throw new Error("目标Agent不存在");
    }
    const agentInfo = targetAgent.info as unknown as AgentInfo;
    target = agentInfo.ip.ipv4;
    forward.target = target;
  }
  if (method === ForwardMethod.GOST) {
    const gost = await Gost(agentId);
    await gost.addForward(forward);
    options = gost.config;
  }
  if (method === ForwardMethod.REALM) {
    const realm = await Realm(forward.agentId);
    await realm.addForward(forward);
    options = realm.config;
  }
  const taskId = await distributeTask({
    agentId: agentId,
    task: {
      action: "add",
      id: "",
      method,
      options,
      forwardId: forward.id,
      type: "forward",
      agentPort: agentPort ?? 0,
      targetPort,
      target,
    },
  });
  return await getTaskResult({ taskId, timeout: 1000 * 60 * 5 });
}

export async function stopForward({ forward }: { forward: Forward }) {
  const taskId = await distributeTask({
    agentId: forward.agentId,
    task: {
      action: "delete",
      id: "",
      method: forward.method,
      options: forward.options as string,
      forwardId: forward.id,
      type: "forward",
      agentPort: forward.agentPort,
      targetPort: forward.targetPort,
      target: forward.target,
    },
  });
  return await getTaskResult({ taskId, timeout: 1000 * 60 * 5 });
}

export async function saveForwardTraffic({
  forwardId,
  traffics,
}: {
  forwardId: string;
  traffics: Prisma.ForwardTrafficCreateManyInput[];
}) {
  // 两分钟保存一次流量，如果不到两分钟则取最后一次
  const lastTraffic = await db.forwardTraffic.findFirst({
    where: {
      forwardId,
    },
    orderBy: {
      time: "desc",
    },
  });
  traffics = traffics.sort(
    (a, b) => (a.time as Date).getTime() - (b.time as Date).getTime(),
  );
  const needSaveTraffics = [];
  let needUpdateLastTraffic = false;
  let totalTraffic = 0;
  for (const traffic of traffics) {
    totalTraffic += traffic.upload + traffic.download;
    if (lastTraffic) {
      if (
        (traffic.time as Date).getTime() - lastTraffic.time.getTime() >
        1000 * 60 * 2
      ) {
        needSaveTraffics.push(traffic);
      } else {
        lastTraffic.upload += traffic.upload;
        lastTraffic.download += traffic.download;
        needUpdateLastTraffic = true;
      }
    } else if (needSaveTraffics.length > 0) {
      const prevTraffic = needSaveTraffics[needSaveTraffics.length - 1]!;
      if (
        (traffic.time as Date).getTime() -
          (prevTraffic.time as Date).getTime() >
        1000 * 60 * 2
      ) {
        needSaveTraffics.push(traffic);
      } else {
        prevTraffic.upload += traffic.upload;
        prevTraffic.download += traffic.download;
      }
    } else {
      needSaveTraffics.push(traffic);
    }
  }
  if (needUpdateLastTraffic && lastTraffic) {
    await db.forwardTraffic.update({
      where: {
        id: lastTraffic.id,
      },
      data: {
        upload: lastTraffic.upload,
        download: lastTraffic.download,
      },
    });
  }
  if (needSaveTraffics.length > 0) {
    await db.forwardTraffic.createMany({
      data: needSaveTraffics,
    });
  }
  if (totalTraffic > 0) {
    await deductBalance({
      forwardId,
      startTime: traffics[0]!.time as Date,
      endTime: traffics[traffics.length - 1]!.time as Date,
      traffic: totalTraffic,
    });
  }
}

interface DeductBalanceParams {
  forwardId: string;
  startTime: Date;
  endTime: Date;
  traffic: number;
}

export async function deductBalance(params: DeductBalanceParams) {
  const { forwardId, startTime, endTime, traffic } =
    await tempWaitDeductBalance(params);
  const forward = await getForwardMust(forwardId);
  let trafficPriceConfig = await getConfig({
    key: "TRAFFIC_PRICE",
    relationId: forward.agentId,
  });
  if (!trafficPriceConfig) {
    trafficPriceConfig = await getConfig({ key: "TRAFFIC_PRICE" });
  }
  if (!trafficPriceConfig) {
    logger.error("traffic price not configured!");
    return;
  }
  const trafficPriceParsed = trafficPriceSchema.safeParse(trafficPriceConfig);
  if (!trafficPriceParsed.success) {
    logger.error("traffic price config parse failed", trafficPriceParsed.error);
    return;
  }
  const trafficPrice = trafficPriceParsed.data;

  const convertedTraffic = convertBytes(
    traffic,
    "Bytes",
    trafficPrice.unit as keyof typeof BYTE_UNITS,
  );
  if (
    convertedTraffic < 1 &&
    endTime.getTime() - startTime.getTime() < 1000 * 60 * 2
  ) {
    return;
  }
  const amount = convertedTraffic * trafficPrice.price;
  const [suitableTraffic, suitableUnit] = convertBytesToBestUnit(traffic);
  const relatedInfo = {
    forwardId,
    startTime,
    endTime,
    traffic,
    convertedTraffic,
    trafficPrice,
  };
  await updateUserWallet({
    id: forward.createdById,
    amount: -amount,
    balanceType: BalanceType.CONSUMPTION,
    type: BalanceLogType.TRAFFIC_CONSUMPTION,
    extra: `使用流量 ${suitableTraffic} ${suitableUnit} 扣除`,
    relatedInfo: relatedInfo,
  })
    .then(async () => {
      await redis.hdel("wait_deduct_balance_forward", forwardId);
      const agent = await getAgentMust(forward.agentId);
      await updateUserWallet({
        id: agent.createdById,
        amount: amount,
        balanceType: BalanceType.INCOME,
        type: BalanceLogType.TRAFFIC_INCOME,
        extra: `流量[ ${suitableTraffic} ${suitableUnit} ]收入`,
        relatedInfo: relatedInfo,
      });
    })
    .catch(async (err) => {
      logger.error(
        {
          err,
          relatedInfo,
        },
        "deduct balance failed",
      );
      const networkId = (
        await db.networkEdge.findFirst({
          where: {
            sourceForwardId: forwardId,
          },
        })
      )?.networkId;
      if (networkId) {
        await deleteNetwork(networkId);
      } else {
        await deleteForward(forwardId);
      }
      logger.info(
        `Because deduct balance failed, forward ${forwardId} and related network has been deleted`,
      );
    });
}

export async function tempWaitDeductBalance(params: DeductBalanceParams) {
  const waitDeductBalanceData = await redis.hget(
    "wait_deduct_balance_forward",
    params.forwardId,
  );
  if (waitDeductBalanceData) {
    const waitDeductBalance = JSON.parse(waitDeductBalanceData);
    params.traffic += waitDeductBalance.traffic;
    const waitDeductBalanceStartTime = new Date(
      waitDeductBalance.startTime as string,
    );
    const waitDeductBalanceEndTime = new Date(
      waitDeductBalance.endTime as string,
    );
    if (waitDeductBalanceStartTime.getTime() < params.startTime.getTime()) {
      params.startTime = waitDeductBalanceStartTime;
    }
    if (waitDeductBalanceEndTime.getTime() > params.endTime.getTime()) {
      params.endTime = waitDeductBalanceEndTime;
    }
  }
  await redis.hset(
    "wait_deduct_balance_forward",
    params.forwardId,
    JSON.stringify(params),
  );
  return params;
}

export async function getForwardMust(id: string) {
  const forward = await db.forward.findUnique({
    where: {
      id,
      deleted: false,
    },
  });
  if (!forward) {
    throw new Error(`Forward ${id} not found`);
  }
  return forward;
}
