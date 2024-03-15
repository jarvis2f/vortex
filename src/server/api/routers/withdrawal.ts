import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { env } from "~/env";
import { $Enums, Prisma } from ".prisma/client";
import {
  getUserWalletMust,
  getWaitWithdrawalAmount,
  updateUserWallet,
} from "~/server/core/user";
import { TRPCError } from "@trpc/server";
import WithdrawalWhereInput = Prisma.WithdrawalWhereInput;
import WithdrawalStatus = $Enums.WithdrawalStatus;

export const withdrawalRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        size: z.number(),
        keyword: z.string().optional(),
        status: z.array(z.nativeEnum(WithdrawalStatus)).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { page, size, keyword, status } = input;
      const where: WithdrawalWhereInput = {
        OR: keyword
          ? [{ id: { equals: keyword } }, { userId: { equals: keyword } }]
          : undefined,
        status: status ? { in: status } : undefined,
      };
      const [withdrawals, total] = await Promise.all([
        ctx.db.withdrawal.findMany({
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
        ctx.db.withdrawal.count({ where }),
      ]);
      return {
        withdrawals: withdrawals.map((withdrawal) => ({
          ...withdrawal,
          amount: withdrawal.amount.toNumber(),
        })),
        total,
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
                .min(1, "Amount must be at least 100")
                .max(1000000, "Amount must be at most 1,000,000"),
        address: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const wallet = await getUserWalletMust(userId);
      const waitWithdrawalAmount = await getWaitWithdrawalAmount(userId);
      if (wallet.incomeBalance.sub(waitWithdrawalAmount).lt(input.amount)) {
        throw new TRPCError({
          message: "Insufficient balance",
          code: "BAD_REQUEST",
        });
      }
      return ctx.db.withdrawal.create({
        data: {
          status: "CREATED",
          address: input.address,
          amount: input.amount,
          userId: userId,
        },
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(WithdrawalStatus),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const withdrawal = await ctx.db.withdrawal.findUnique({
        where: {
          id: input.id,
        },
      });
      if (!withdrawal) {
        throw new TRPCError({
          message: "Withdrawal not found",
          code: "BAD_REQUEST",
        });
      }
      if (input.status === "WITHDRAWN") {
        await updateUserWallet({
          id: withdrawal.userId,
          amount: withdrawal.amount.neg().toNumber(),
          balanceType: "INCOME",
          type: "WITHDRAWAL",
          extra: "提现",
          relatedInfo: {
            withdrawalId: withdrawal.id,
          },
        });
      }
      return ctx.db.withdrawal.update({
        where: {
          id: input.id,
        },
        data: {
          status: input.status,
        },
      });
    }),
});
