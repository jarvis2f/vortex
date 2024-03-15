import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  encryptPassword,
  generateSalt,
  getUserMust,
  getUserWalletMust,
  updateUserWallet,
  updateUserWalletSchema,
  validateDataPermission,
} from "~/server/core/user";
import { BalanceType, Role } from "@prisma/client";
import { Prisma, UserStatus } from ".prisma/client";
import BalanceRechargeCodeWhereInput = Prisma.BalanceRechargeCodeWhereInput;
import BalanceRechargeCodeCreateManyInput = Prisma.BalanceRechargeCodeCreateManyInput;
import dayjs from "dayjs";
import { Decimal } from "@prisma/client/runtime/library";

export const userRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        size: z.number(),
        keyword: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { page, size, keyword } = input;
      const where = keyword ? { name: { contains: keyword } } : undefined;
      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where: where,
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
            roles: true,
            status: true,
            createdAt: true,
          },
          skip: page * size,
          take: size,
          orderBy: {
            id: "desc",
          },
        }),
        ctx.db.user.count({
          where: where,
        }),
      ]);
      return {
        users,
        total,
      };
    }),

  getOne: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { id } = input;
      const user = await getUserMust(id);
      validateDataPermission(ctx.session, { userId: id }, "data:user");
      return {
        id: user.id,
        name: user.name,
        image: user.image,
        email: user.email,
        roles: user.roles,
        isSetupPassword: !!user.password,
      };
    }),

  updatePassword: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        password: z.string(),
        originalPassword: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, originalPassword } = input;
      let { password } = input;
      if (ctx.session.user.id !== id) {
        throw new TRPCError({
          message: "You can only change your own password",
          code: "FORBIDDEN",
        });
      }
      const salt = generateSalt();
      password = encryptPassword(password, salt);

      const user = await getUserMust(id);
      if (originalPassword) {
        const originalPasswordEncrypted = encryptPassword(
          originalPassword,
          user.passwordSalt ?? "",
        );
        if (originalPasswordEncrypted !== user.password) {
          throw new TRPCError({
            message: "Original password is incorrect",
            code: "FORBIDDEN",
          });
        }
      }

      return ctx.db.user.update({
        where: {
          id,
        },
        data: {
          password,
          passwordSalt: salt,
        },
      });
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .optional()
          .refine(
            (v) => v && !["admin", "user", "管理员"].includes(v),
            "名称非法",
          ),
        image: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id } = ctx.session.user;
      if (ctx.session.user.id !== id) {
        throw new TRPCError({
          message: "You can only change your own profile",
          code: "FORBIDDEN",
        });
      }
      return ctx.db.user.update({
        where: {
          id,
        },
        data: {
          ...input,
        },
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(UserStatus),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, status } = input;
      return ctx.db.user.update({
        where: {
          id,
        },
        data: {
          status,
        },
      });
    }),

  updateRoles: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        roles: z.array(z.nativeEnum(Role)),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, roles } = input;
      return ctx.db.user.update({
        where: {
          id,
        },
        data: {
          roles: {
            set: roles,
          },
        },
      });
    }),

  //<-----------------------------wallet balance---------------------------------->

  getWallet: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const wallet = await getUserWalletMust(input.id);
      validateDataPermission(
        ctx.session,
        wallet as { userId: string },
        "data:wallet",
      );
      return wallet;
    }),

  getYesterdayBalanceChange: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { id } = input;
      validateDataPermission(ctx.session, { userId: id }, "data:wallet");
      const yesterdayStart = dayjs().subtract(1, "day").startOf("day").toDate();
      const yesterdayEnd = dayjs().subtract(1, "day").endOf("day").toDate();
      const balanceLogs = await ctx.db.balanceLog.findMany({
        where: {
          userId: id,
          createdAt: {
            gte: yesterdayStart,
            lte: yesterdayEnd,
          },
        },
      });
      // 按 balanceType 分组
      const balanceChange: Record<string, Decimal> = {};
      for (const log of balanceLogs) {
        balanceChange[log.balanceType] = (
          balanceChange[log.balanceType] ?? new Decimal(0)
        ).add(log.amount);
      }
      return balanceChange;
    }),

  getBalanceLogs: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        balanceType: z.nativeEnum(BalanceType).optional(),
        limit: z.number().min(0).max(100).default(10),
        cursor: z.number().nullish(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { id, balanceType, limit, cursor } = input;
      validateDataPermission(ctx.session, { userId: id }, "data:wallet");
      const balanceLogs = await ctx.db.balanceLog.findMany({
        take: limit,
        skip: cursor ? 1 : 0,
        where: {
          userId: id,
          balanceType: balanceType,
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          id: "desc",
        },
      });

      let nextCursor: number | undefined = undefined;
      if (balanceLogs.length >= limit) {
        const minId = await ctx.db.balanceLog.findFirst({
          where: {
            userId: id,
          },
          orderBy: {
            id: "asc",
          },
        });
        const nextLog = balanceLogs[balanceLogs.length - 1];
        if (nextLog && minId && nextLog.id > minId.id) {
          nextCursor = nextLog.id;
        }
      }
      return {
        logs: balanceLogs.map((log) => ({
          ...log,
          amount: log.amount.toNumber(),
          afterBalance: log.afterBalance.toNumber(),
        })),
        nextCursor,
      };
    }),

  updateBalance: protectedProcedure
    .input(updateUserWalletSchema)
    .mutation(async ({ input }) => {
      return updateUserWallet(input);
    }),

  rechargeBalanceByCode: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        code: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, code } = input;
      const wallet = await getUserWalletMust(id);
      validateDataPermission(
        ctx.session,
        wallet as { userId: string },
        "data:wallet",
      );
      const rechargeCode = await ctx.db.balanceRechargeCode.findUnique({
        where: {
          code,
          used: false,
        },
      });
      if (!rechargeCode) {
        throw new TRPCError({
          message: "Recharge code not found or used",
          code: "BAD_REQUEST",
        });
      }
      const { amount } = rechargeCode;
      await ctx.db.balanceRechargeCode.update({
        where: {
          id: rechargeCode.id,
        },
        data: {
          used: true,
          usedById: id,
        },
      });
      return updateUserWallet({
        id,
        amount: amount.toNumber(),
        extra: `充值码充值`,
        balanceType: "CONSUMPTION",
        type: "RECHARGE_CODE",
        relatedInfo: {
          code,
        },
      });
    }),
});

export const rechargeCodeRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        size: z.number(),
        keyword: z.string().optional(),
        used: z.boolean().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { page, size, keyword } = input;
      const where: BalanceRechargeCodeWhereInput = {
        OR: keyword
          ? [
              { code: { contains: keyword } },
              { usedById: { equals: keyword } },
              { amount: { equals: keyword } },
            ]
          : undefined,
        used: input.used,
      };
      const [rechargeCodes, total] = await Promise.all([
        ctx.db.balanceRechargeCode.findMany({
          where: where,
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
          orderBy: {
            updatedAt: "desc",
          },
        }),
        ctx.db.balanceRechargeCode.count({
          where: where,
        }),
      ]);
      return {
        rechargeCodes: rechargeCodes.map((code) => ({
          ...code,
          amount: code.amount.toNumber(),
        })),
        total,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        num: z.number().positive().default(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { amount, num } = input;
      const codes = [];
      for (let i = 0; i < num; i++) {
        const code = Math.random().toString(36).substring(2, 12).toUpperCase();
        codes.push({ code });
      }
      // TODO: 判断是否有重复的code
      const rechargeCodes: BalanceRechargeCodeCreateManyInput[] = [];
      for (const { code } of codes) {
        rechargeCodes.push({
          amount,
          code: code,
          used: false,
        });
      }
      await ctx.db.balanceRechargeCode.createMany({
        data: rechargeCodes,
      });
      return codes;
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.balanceRechargeCode.delete({
        where: {
          id: input.id,
          used: false,
        },
      });
    }),
});
