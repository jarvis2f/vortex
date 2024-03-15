import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { type NetworkEdgeParsed, type NetworkFlow } from "~/lib/types/agent";
import { type NetworkEdge, Prisma } from ".prisma/client";
import {
  createNetwork,
  deleteNetwork,
  getNetworkMust,
  parseNetworkEdge,
  validateNetworkEdge,
} from "~/server/core/network";
import NetworkCreateInput = Prisma.NetworkCreateInput;
import NetworkWhereInput = Prisma.NetworkWhereInput;
import { hasPermission } from "~/lib/constants/permission";
import {
  validateDataPermission,
  validateUserConsumableBalance,
} from "~/server/core/user";
import { db } from "~/server/db";

export const networkRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        size: z.number(),
        keyword: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, size, keyword } = input;
      const where: NetworkWhereInput = {
        deleted: false,
        name: keyword ? { contains: keyword } : undefined,
        createdById: hasPermission(ctx.session, "data:network")
          ? undefined
          : ctx.session.user.id,
      };
      const [networks, total] = await Promise.all([
        ctx.db.network.findMany({
          where,
          skip: page * size,
          take: size,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            edges: {
              include: {
                sourceForward: {
                  select: {
                    id: true,
                    agentPort: true,
                    target: true,
                    targetPort: true,
                    status: true,
                    agent: {
                      select: {
                        id: true,
                        name: true,
                        info: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        ctx.db.network.count({
          where,
        }),
      ]);
      const forwards = networks.flatMap((network) =>
        network.edges.map((edge) => edge.sourceForward!),
      );
      const forwardTraffics = await db.forwardTraffic.groupBy({
        by: ["forwardId"],
        where: {
          forwardId: {
            in: forwards.map((forward) => forward.id),
          },
        },
        _sum: {
          download: true,
          upload: true,
        },
      });
      const forwardTrafficMap = new Map<
        string,
        { download: number; upload: number }
      >();
      forwardTraffics.forEach((traffic) => {
        forwardTrafficMap.set(traffic.forwardId, {
          download: traffic._sum.download ?? 0,
          upload: traffic._sum.upload ?? 0,
        });
      });

      return {
        networks: networks.map((network) => {
          const traffic = network.edges.reduce(
            (acc, edge) => {
              const forwardTraffic = forwardTrafficMap.get(
                edge.sourceForward?.id ?? "",
              );
              if (forwardTraffic) {
                acc.download += forwardTraffic.download;
                acc.upload += forwardTraffic.upload;
              }
              return acc;
            },
            { download: 0, upload: 0 },
          );
          return {
            ...network,
            traffic,
          };
        }),
        total,
      };
    }),
  getOne: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id } = input;
      const network = await getNetworkMust(id);
      validateDataPermission(ctx.session, network, "data:network");
      return network;
    }),
  createOrUpdate: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        flow: z.any().optional(),
        applyToNetwork: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, name, flow, applyToNetwork } = input;
      const networkEdgeLinked = parseNetworkEdge(flow as NetworkFlow);
      await validateNetworkEdge(networkEdgeLinked, ctx.session.user.id);
      await validateUserConsumableBalance(ctx.session.user.id);
      const data: Omit<NetworkCreateInput, "createdBy"> = {
        name,
        flow,
      };
      let network;
      if (id) {
        network = await ctx.db.network.update({
          where: {
            id,
          },
          data: data,
        });
      } else {
        network = await ctx.db.network.create({
          data: {
            ...data,
            createdBy: {
              connect: {
                id: ctx.session.user.id,
              },
            },
          },
        });
      }
      const networkId = network.id;
      if (applyToNetwork) {
        const networkEdgeParsers = await createNetwork({
          flow: flow as NetworkFlow,
          networkId,
          userId: ctx.session.user.id,
        });
        let edge: NetworkEdgeParsed | undefined = networkEdgeParsers.lastEdge;
        let prevEdge: NetworkEdge | null = null;
        while (edge) {
          prevEdge = await ctx.db.networkEdge.create({
            data: {
              networkId,
              sourceAgentId: edge.sourceAgentId,
              targetAgentId: edge.targetAgentId,
              sourceForwardId: edge.sourceForward.forwardId,
              nextEdgeId: prevEdge ? prevEdge.id : undefined,
            },
          });
          edge = edge.prevEdge;
        }
      }
      return network;
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return await deleteNetwork(input.id);
    }),
});
