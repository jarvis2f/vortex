import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { env } from "~/env";
import { validateDataPermission } from "~/server/core/user";
import { $Enums, Prisma } from ".prisma/client";
import PaymentWhereInput = Prisma.PaymentWhereInput;
import PaymentStatus = $Enums.PaymentStatus;

export const paymentRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        size: z.number(),
        keyword: z.string().optional(),
        status: z.array(z.nativeEnum(PaymentStatus)).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { page, size, keyword, status } = input;
      const where: PaymentWhereInput = {
        OR: keyword
          ? [
              { id: { equals: keyword } },
              { userId: { equals: keyword } },
              { paymentInfo: { string_contains: keyword } },
              { callback: { string_contains: keyword } },
            ]
          : undefined,
        status: status ? { in: status } : undefined,
      };
      const [payments, total] = await Promise.all([
        ctx.db.payment.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: page * size,
          take: size,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        }),
        ctx.db.payment.count({ where }),
      ]);
      return {
        payments: payments.map((payment) => ({
          ...payment,
          amount: payment.amount.toNumber(),
          targetAmount: payment.targetAmount.toNumber(),
        })),
        total,
      };
    }),
  getOne: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const payment = await ctx.db.payment.findUnique({
        where: {
          id: input.id,
        },
      });
      if (!payment) return undefined;
      validateDataPermission(ctx.session, payment, "data:payment");
      return {
        id: payment.id,
        status: payment.status,
        amount: payment.amount.toNumber(),
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        amount:
          env.NODE_ENV === "development"
            ? z.number()
            : z
                .number()
                .min(0.01, "Amount must be at least 0.01")
                .max(1000000, "Amount must be at most 1,000,000"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.payment
        .create({
          data: {
            status: "CREATED",
            targetAmount: input.amount,
            amount: 0,
            userId: ctx.session.user.id,
          },
        })
        .then((payment) => ({
          id: payment.id,
          status: payment.status,
          amount: payment.amount.toNumber(),
        }));
    }),
});
