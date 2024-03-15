import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import {
  $Enums,
  type Forward,
  ForwardTargetType,
  Prisma,
} from ".prisma/client";
import {
  createForward,
  createForwardSchema,
  deleteForward,
  getForwardMust,
} from "~/server/core/forward";
import { getAgentMust } from "~/server/core/agent";
import dayjs from "dayjs";
import { hasPermission } from "~/lib/constants/permission";
import { AgentStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  validateDataPermission,
  validateUserConsumableBalance,
} from "~/server/core/user";
import { ForwardTrafficDimensions } from "~/lib/constants";
import ForwardWhereInput = Prisma.ForwardWhereInput;
import ForwardStatus = $Enums.ForwardStatus;

export const forwardRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        size: z.number(),
        keyword: z.string().optional(), // agentId or userId or remark
        status: z.array(z.nativeEnum(ForwardStatus)).optional(),
        agentId: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { page, size, keyword, status, agentId } = input;
      const where: ForwardWhereInput = {
        deleted: false,
      };
      if (keyword) {
        where.OR = [
          { agentId: { contains: keyword } },
          { createdById: { contains: keyword } },
          { remark: { contains: keyword } },
        ];
      }
      agentId && (where.agentId = agentId);
      status && (where.status = { in: status });
      hasPermission(ctx.session, "data:forward") ||
        (where.createdById = ctx.session.user.id);
      const [forwards, total] = await Promise.all([
        ctx.db.forward.findMany({
          where: where,
          skip: page * size,
          take: size,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            agent: {
              select: {
                id: true,
                name: true,
                info: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        }),
        ctx.db.forward.count({
          where: where,
        }),
      ]);
      const forwardsConverted = await Promise.all(
        forwards.map(async (forward) => {
          let targetAgent = null;
          if (forward.targetType === ForwardTargetType.AGENT) {
            const agent = await getAgentMust(forward.target);
            targetAgent = {
              id: agent.id,
              name: agent.name,
              info: agent.info,
            };
          }
          return {
            ...forward,
            targetAgent,
          };
        }),
      );
      return {
        forwards: forwardsConverted,
        total,
      };
    }),

  create: protectedProcedure
    .input(createForwardSchema)
    .mutation(async ({ input, ctx }) => {
      const agent = await getAgentMust(input.agentId);
      if (agent.status !== AgentStatus.ONLINE) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "服务器不在线",
        });
      }
      await validateUserConsumableBalance(ctx.session.user.id);
      return await createForward({
        params: input,
        userId: ctx.session.user.id,
      });
    }),

  updateRemark: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        remark: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, remark } = input;
      const forward = await getForwardMust(id);
      await ctx.db.forward.update({
        where: {
          id,
        },
        data: {
          remark,
        },
      });
      return {
        forward,
      };
    }),

  resetUsedTrafficTraffic: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const forward = await getForwardMust(id);
      await ctx.db.forward.update({
        where: {
          id,
        },
        data: {
          usedTraffic: 0,
        },
      });
      return {
        forward,
      };
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const networkEdge = await ctx.db.networkEdge.findFirst({
        where: {
          sourceForwardId: id,
          deleted: false,
        },
      });
      if (networkEdge) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "该转发通过组网创建，请直接删除组网",
        });
      }
      return await deleteForward(id);
    }),

  trafficUsage: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        month: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        dimensions: z
          .nativeEnum(ForwardTrafficDimensions)
          .default(ForwardTrafficDimensions.forward),
      }),
    )
    .query(async ({ input, ctx }) => {
      let { startDate, endDate } = input;
      if (startDate && endDate) {
        startDate = dayjs(startDate).startOf("day").toDate();
        endDate = dayjs(endDate).endOf("day").toDate();
      } else {
        let month = input.month;
        if (!month) {
          month = dayjs().month() + 1;
        }
        startDate = dayjs()
          .month(month - 1)
          .startOf("month")
          .toDate();
        endDate = dayjs()
          .month(month - 1)
          .endOf("month")
          .toDate();
      }
      let forwardTraffics;
      if (input.dimensions === "forward") {
        const forward = await getForwardMust(input.id!);
        validateDataPermission(ctx.session, forward, "data:forward");
        forwardTraffics = await ctx.db.forwardTraffic.findMany({
          where: {
            forwardId: input.id,
            time: {
              gte: startDate,
              lte: endDate,
            },
          },
        });
      } else {
        let forwards: Forward[];
        if (input.dimensions === "user") {
          forwards = await ctx.db.forward.findMany({
            where: {
              createdById: ctx.session.user.id,
              deleted: false,
            },
          });
        } else if (input.dimensions === "network") {
          forwards = (
            await ctx.db.networkEdge.findMany({
              where: {
                networkId: input.id,
                deleted: false,
              },
              include: {
                sourceForward: true,
              },
            })
          ).map((edge) => edge.sourceForward!);
        } else {
          forwards = await ctx.db.forward.findMany({
            where: {
              agentId: input.id,
              deleted: false,
            },
          });
        }

        const forwardIds = forwards.map((forward) => forward.id);
        forwardTraffics = await ctx.db.forwardTraffic.findMany({
          where: {
            forwardId: {
              in: forwardIds,
            },
            time: {
              gte: startDate,
              lte: endDate,
            },
          },
        });
      }
      const result: {
        date: string;
        upload: number;
        download: number;
      }[] = [];

      for (
        let date = dayjs(startDate);
        date.isBefore(endDate);
        date = date.add(1, "day")
      ) {
        const dateStr = date.format("YYYY-MM-DD");
        const usage = forwardTraffics
          .filter((item) => dayjs(item.time).format("YYYY-MM-DD") === dateStr)
          .reduce(
            (prev, next) => {
              return {
                upload: prev.upload + next.upload,
                download: prev.download + next.download,
              };
            },
            { upload: 0, download: 0 },
          );
        result.push({
          date: dateStr,
          ...usage,
        });
      }

      return result;
    }),
});
