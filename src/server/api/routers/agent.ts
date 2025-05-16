import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { $Enums, type Agent, type AgentStat, Prisma } from ".prisma/client";
import { TRPCError } from "@trpc/server";
import { redis } from "~/server/db";
import {
  AGENT_TASK_TYPES,
  type AgentInfo,
  type AgentPingTask,
  type AgentShellTask,
  type AgentStatRecord,
  type AgentTaskBodyType,
  type ConnectConfig,
} from "~/lib/types/agent";
import { env } from "~/env";
import {
  convertStats,
  getAgentMust,
  handleSetConfig,
} from "src/server/core/agent";
import { type JsonObject } from "@prisma/client/runtime/library";
import { hasPermission } from "~/lib/constants/permission";
import { validateDataPermission } from "~/server/core/user";
import { type Session } from "next-auth";
import { generateServerKeyPair } from "~/lib/utils";
import { distributeTask, getTaskResult } from "~/server/core/agent-task";
import { ForwardMethod } from ".prisma/client";
import AgentStatus = $Enums.AgentStatus;
import AgentWhereInput = Prisma.AgentWhereInput;

export const agentRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const agents = await ctx.db.agent.findMany({
      where: getPermissionFilter(ctx),
      orderBy: {
        id: "desc",
      },
    });

    return agents.reduce(
      (
        groups: {
          [key in AgentStatus]: Agent[];
        },
        agent: Agent,
      ) => {
        const status = agent.status as AgentStatus;
        if (!groups[status]) {
          groups[status] = [];
        }
        groups[status].push(agent);
        return groups;
      },
      {
        [AgentStatus.ONLINE]: [],
        [AgentStatus.OFFLINE]: [],
        [AgentStatus.UNKNOWN]: [],
      },
    );
  }),

  getOne: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const agent = await getAgentMust(input.id);
      validateDataPermission(
        ctx.session,
        agent,
        "data:agent",
        () => agent.isShared,
      );
      return agent;
    }),

  getOptions: protectedProcedure.query(async ({ ctx }) => {
    const agents = await ctx.db.agent.findMany({
      where: {
        ...getPermissionFilter(ctx),
        status: AgentStatus.ONLINE,
      },
      orderBy: {
        name: "asc",
      },
    });
    return agents.map((agent: Agent) => ({
      label: agent.name,
      value: agent.id,
    }));
  }),

  stats: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const agent = await getAgentMust(input.id);
      validateDataPermission(
        ctx.session,
        agent,
        "data:agent",
        () => agent.isShared,
      );
      const statsJson = await redis.lrange(`agent_status:${agent.id}`, 0, 19);

      let stats = convertStats(statsJson).reverse();
      const persistenceStats = await ctx.db.agentStat.findMany({
        where: { agentId: agent.id },
        orderBy: { time: "desc" },
        take: 20 - stats.length,
      });

      stats = persistenceStats
        .reverse()
        .map((s: AgentStat) => ({
          ...(s.stat as unknown as AgentStatRecord),
        }))
        .concat(stats);

      return {
        stats: stats,
        ...agent,
        info: agent.info as unknown as AgentInfo,
      };
    }),

  getInstallInfo: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        alpha: z.boolean().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const agent = await getAgentMust(input.id);
      validateDataPermission(ctx.session, agent, "data:agent");
      const connectConfig = agent.connectConfig as unknown as ConnectConfig;
      let installShell: string;
      if (env.NODE_ENV === "production" || input.alpha) {
        const params = `${agent.id}|${connectConfig.serverPublicKey}|${env.SERVER_URL}`;
        installShell = `sudo curl -O ${
          env.AGENT_SHELL_URL
        }/vortex.sh && sudo chmod +x vortex.sh && sudo ./vortex.sh ${btoa(
          params,
        )}`;
      } else {
        installShell = `./vortex agent start -s ${env.SERVER_URL} -i ${agent.id} -k ${connectConfig.serverPublicKey} --log-level debug --log-dest remote --dir /root/vortex`;
      }
      return {
        ...agent,
        installShell,
        uninstallShell: `sudo curl -O ${env.AGENT_SHELL_URL}/uninstall.sh && chmod +x ./uninstall.sh && sudo ./uninstall.sh && rm -rf ./*`,
      };
    }),

  refreshKey: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const agent = await getAgentMust(input.id);
      validateDataPermission(ctx.session, agent, "data:agent");
      const keyPair = generateServerKeyPair();
      const connectConfig: ConnectConfig = {
        ...(agent.connectConfig as unknown as ConnectConfig),
        serverPrivateKey: keyPair.serverPrivateKey,
        serverPublicKey: keyPair.serverPublicKey,
      };
      await ctx.db.agent.update({
        where: { id: input.id },
        data: {
          connectConfig: connectConfig as any,
        },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const keyPair = generateServerKeyPair();
      const agent = await ctx.db.agent.create({
        data: {
          name: input.name,
          description: input.description,
          info: {},
          connectConfig: {
            serverPrivateKey: keyPair.serverPrivateKey,
            serverPublicKey: keyPair.serverPublicKey,
          } as JsonObject,
          createdBy: {
            connect: {
              id: ctx.session.user.id,
            },
          },
        },
      });
      void handleSetConfig();
      return agent;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        isShared: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const agent = await getAgentMust(input.id);
      validateDataPermission(ctx.session, agent, "data:agent");
      return ctx.db.agent.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          isShared: input.isShared,
        },
      });
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const agent = await getAgentMust(input.id);
      validateDataPermission(ctx.session, agent, "data:agent");
      return ctx.db.agent.update({
        where: { id: input.id },
        data: {
          deleted: true,
        },
      });
    }),

  executeCommand: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        type: z.enum(AGENT_TASK_TYPES).default("shell"),
        command: z.string(),
        timeout: z.number().default(1000 * 60 * 5),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, type, command, timeout } = input;
      const agent = await getAgentMust(id);
      validateDataPermission(ctx.session, agent, "data:agent");
      if (agent.status != AgentStatus.ONLINE) {
        throw new TRPCError({
          message: "Agent is not online",
          code: "BAD_REQUEST",
        });
      }
      const task: AgentTaskBodyType = {
        id: "",
        type: type,
      };
      if (type === "shell") {
        (task as AgentShellTask).shell = command;
        (task as AgentShellTask).internal = false;
      }
      const taskId = await distributeTask({
        agentId: id,
        task: task,
      });
      return await getTaskResult({ taskId, timeout });
    }),

  ping: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        target: z.string(),
        targetType: z.enum(["agent", "host"]).default("agent"),
        agentPort: z.number().optional(),
        forwardMethod: z.nativeEnum(ForwardMethod).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, targetType } = input;
      let { target } = input;
      const agent = await getAgentMust(id);
      if (agent.status != AgentStatus.ONLINE) {
        throw new TRPCError({
          message: "Agent is not online",
          code: "BAD_REQUEST",
        });
      }
      if (targetType === "agent") {
        const targetAgent = await getAgentMust(target);
        if (targetAgent.status != AgentStatus.ONLINE) {
          throw new TRPCError({
            message: "Target agent is not online",
            code: "BAD_REQUEST",
          });
        }
        target = (targetAgent.info as unknown as AgentInfo).ip.ipv4;
      }
      if (!target) {
        throw new TRPCError({
          message: "Target agent ip not found",
          code: "BAD_REQUEST",
        });
      }
      const task: AgentPingTask = {
        id: "",
        type: "ping",
        host: target,
        count: 3,
        timeout: 30,
      };

      if (input.forwardMethod === "GOST" || input.forwardMethod === "REALM") {
        task.forwardMethod = input.forwardMethod;
      }

      if (input.agentPort) {
        task.agentPort = input.agentPort;
      }
      const taskId = await distributeTask({
        agentId: id,
        task: task,
      });
      return await getTaskResult({ taskId, timeout: 1000 * 60 });
    }),
  iperf3: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        target: z.string(),
        targetType: z.enum(["agent", "host"]).default("agent"),
      }),
    )
    .mutation(async () => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED" });
    }),
});

function getPermissionFilter(ctx: { session: Session }): AgentWhereInput {
  const where: AgentWhereInput = {
    deleted: false,
  };
  if (hasPermission(ctx.session, "data:agent")) {
    return where;
  }
  where.OR = [
    {
      isShared: true,
    },
    {
      createdById: ctx.session.user.id,
    },
  ];
  return where;
}
