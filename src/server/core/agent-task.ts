import {
  type AgentTask,
  AgentTaskStatus,
  ForwardMethod,
  ForwardStatus,
  Prisma,
} from ".prisma/client";
import type {
  AgentForwardTask,
  AgentHelloTask,
  AgentTaskBodyType,
  AgentTaskResult,
} from "~/lib/types/agent";
import type { JsonObject } from "@prisma/client/runtime/library";
import { db, redis, subRedis } from "~/server/db";
import Gost from "~/server/core/gost";
import { TRPCError } from "@trpc/server";
import globalLogger from "~/server/logger";
import ForwardUpdateInput = Prisma.ForwardUpdateInput;

const logger = globalLogger.child({ module: "agent-task" });

const memAgentTasks: Record<string, AgentTask> = {};

export async function distributeTask({
  agentId,
  task,
}: {
  agentId: string;
  task: AgentTaskBodyType;
}) {
  const agentTask = {
    type: task.type,
    agentId,
    status: AgentTaskStatus.CREATED,
    task: task as unknown as JsonObject,
  };
  if (task.type === "hello" && (task as AgentHelloTask).mem) {
    const now = new Date();
    task.id = `mem_${agentId.substring(18)}_hello}`;
    memAgentTasks[task.id] = {
      ...agentTask,
      id: task.id,
      status: AgentTaskStatus.CREATED,
      result: {},
      createdAt: now,
      updatedAt: now,
    };
  } else {
    task.id = (
      await db.agentTask.create({
        data: agentTask,
      })
    ).id;
  }
  await redis.publish(`agent_task_${agentId}`, JSON.stringify(task));
  return task.id;
}

export async function subscribeTaskResult() {
  await subRedis.psubscribe(`agent_task_result_*`);

  subRedis.on("pmessage", (pattern, channel, message) => {
    if (!channel.startsWith("agent_task_result_")) {
      logger.warn(
        `unknown channel ${channel} received, message: ${message}, ignored`,
      );
      return;
    }
    void handlePreTaskResult({ channel, message }).catch((reason) => {
      logger.error(`处理任务结果失败. ${reason}`);
    });
  });

  subRedis.on("error", (error) => {
    logger.error(`redis error: ${error.message}`);
  });

  subRedis.on("close", () => {
    logger.error(`redis connection closed`);
  });
}

export async function handlePreTaskResult({
  channel,
  message,
}: {
  channel: string;
  message: string;
}) {
  logger.debug(`开始处理任务结果. Channel: ${channel}, Message: ${message}`);
  const agentId = channel.slice(18);
  const agent = await db.agent.findUnique({ where: { id: agentId } });
  if (!agent) {
    logger.warn(`处理任务结果失败. Agent ${agentId} 不存在`);
    return;
  }
  const taskResult = JSON.parse(message) as AgentTaskResult;
  const taskId = taskResult.id;
  let task =
    memAgentTasks[taskId] ??
    (await db.agentTask.findUnique({
      where: { id: taskId },
    }));
  if (!task) {
    logger.warn(
      `处理任务结果失败. 任务 ${taskId} 不存在. Agent ${agentId}. Result: ${message}`,
    );
    return;
  }
  task = {
    ...task,
    status: taskResult.success
      ? AgentTaskStatus.SUCCEEDED
      : AgentTaskStatus.FAILED,
    result: taskResult as unknown as JsonObject,
  };
  await handleTaskResult({ task });
  if (taskId.startsWith("mem_")) {
    memAgentTasks[taskId] = task;
  } else {
    await db.agentTask.update({
      where: { id: task.id },
      data: {
        status: taskResult.success
          ? AgentTaskStatus.SUCCEEDED
          : AgentTaskStatus.FAILED,
        result: taskResult as unknown as JsonObject,
      },
    });
  }
}

export async function handleTaskResult({ task }: { task: AgentTask }) {
  try {
    switch (task.type) {
      case "forward":
        await handleForwardTaskResult({ task });
        break;
    }
  } catch (error: any) {
    logger.error(`处理任务结果失败. ${error}`);
  }
}

export async function handleForwardTaskResult({ task }: { task: AgentTask }) {
  const forwardTask = task.task as unknown as AgentForwardTask;
  const taskResult = task.result as unknown as AgentTaskResult;
  if (!taskResult) {
    logger.warn(`处理转发任务结果失败. 任务 ${task.id} 没有结果`);
    return;
  }
  const isAddForward = forwardTask.action === "add";
  const success = task.status === AgentTaskStatus.SUCCEEDED;
  let forward = await db.forward.findUnique({
    where: { id: forwardTask.forwardId },
  });
  if (!forward) {
    logger.warn(`处理转发任务结果失败. 转发 ${forwardTask.forwardId} 不存在`);
    return;
  }
  const data: ForwardUpdateInput = {};
  const extra =
    success && taskResult.extra
      ? JSON.parse(Buffer.from(taskResult.extra, "base64").toString())
      : taskResult.extra;
  if (success) {
    if (isAddForward) {
      data.agentPort = Number(extra.agentPort);
      data.status = ForwardStatus.RUNNING;
    } else {
      data.deleted = true;
      data.status = ForwardStatus.STOPPED;
    }
  } else {
    if (isAddForward) {
      data.status = ForwardStatus.CREATED_FAILED;
    }
  }

  if (Object.keys(data).length !== 0) {
    forward = await db.forward.update({
      where: { id: forward.id },
      data: data,
    });
    if (isAddForward && forward.method === ForwardMethod.GOST) {
      await (
        await Gost(forward.agentId)
      ).afterForwardSucceededUpdatePort(forward);
    }
  }
}

export async function getTaskResult({
  taskId,
  timeout,
}: {
  taskId: string;
  timeout: number;
}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    let task: AgentTask | null;
    if (taskId.startsWith("mem_")) {
      task = memAgentTasks[taskId] ?? null;
    } else {
      task = await db.agentTask.findUnique({ where: { id: taskId } });
    }
    if (task && task.status !== AgentTaskStatus.CREATED) {
      if (taskId.startsWith("mem_")) {
        delete memAgentTasks[taskId];
      }
      return task.result as unknown as AgentTaskResult;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new TRPCError({
    message: "Get task result timeout",
    code: "TIMEOUT",
  });
}
