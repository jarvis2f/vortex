import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { hasPermission } from "~/lib/constants/permission";
import { Prisma } from ".prisma/client";
import { db } from "~/server/db";
import { TRPCError } from "@trpc/server";
import { validateDataPermission } from "~/server/core/user";
import TicketWhereInput = Prisma.TicketWhereInput;

export const ticketRouter = createTRPCRouter({
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
      const where: TicketWhereInput = {
        OR: keyword
          ? [
              {
                title: {
                  contains: keyword,
                },
                content: {
                  contains: keyword,
                },
              },
            ]
          : undefined,
        createdById: hasPermission(ctx.session, "data:ticket")
          ? undefined
          : ctx.session.user.id,
      };

      const [tickets, total] = await Promise.all([
        ctx.db.ticket.findMany({
          where,
          skip: page * size,
          take: size,
          orderBy: {
            updatedAt: "desc",
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
          },
        }),
        ctx.db.ticket.count({ where }),
      ]);

      return {
        tickets,
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
      const ticket = await getTicketMust(input.id, true);
      validateDataPermission(ctx.session, ticket, "data:ticket");
      const replies = await ctx.db.ticketReply.findMany({
        where: {
          ticketId: input.id,
        },
        orderBy: {
          createdAt: "asc",
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
        },
      });

      return {
        ...ticket,
        replies,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        content: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.ticket.create({
        data: {
          title: input.title,
          content: input.content,
          createdBy: {
            connect: {
              id: ctx.session.user.id,
            },
          },
        },
      });
    }),

  close: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ticket = await getTicketMust(input.id);
      validateDataPermission(ctx.session, ticket, "data:ticket");
      return ctx.db.ticket.update({
        where: {
          id: input.id,
        },
        data: {
          status: "CLOSED",
        },
      });
    }),

  reply: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ticket = await getTicketMust(input.id);
      validateDataPermission(ctx.session, ticket, "data:ticket");
      if (ticket.status === "CLOSED") {
        throw new TRPCError({
          message: "Ticket is closed",
          code: "BAD_REQUEST",
        });
      }
      await ctx.db.ticket.update({
        where: {
          id: input.id,
        },
        data: {
          status: "REPLIED",
          updatedAt: new Date(),
        },
      });
      return ctx.db.ticketReply.create({
        data: {
          content: input.content,
          createdBy: {
            connect: {
              id: ctx.session.user.id,
            },
          },
          ticket: {
            connect: {
              id: input.id,
            },
          },
        },
      });
    }),
});

export async function getTicketMust(id: string, includeCreatedBy = false) {
  const ticket = await db.ticket.findUnique({
    where: {
      id: id,
    },
    include: {
      createdBy: includeCreatedBy
        ? {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          }
        : undefined,
    },
  });
  if (!ticket) {
    throw new TRPCError({
      message: `Ticket ${id} not found`,
      code: "NOT_FOUND",
    });
  }
  return ticket;
}
