import crypto from "crypto";
import { db } from "~/server/db";
import { TRPCError } from "@trpc/server";
import { hasPermission, type PERMISSIONS } from "~/lib/constants/permission";
import { BalanceLogType, BalanceType, Prisma, type Role } from "@prisma/client";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";
import WalletUpdateInput = Prisma.WalletUpdateInput;

export const generateSalt = () => {
  return crypto.randomBytes(16).toString("hex");
};

export function encryptPassword(password: string, salt: string) {
  return crypto
    .pbkdf2Sync(password, salt, 10000, 512, "sha512")
    .toString("hex");
}

export async function getUserMust(id: string) {
  const user = await db.user.findUnique({
    where: { id: id },
  });
  if (!user) {
    throw new TRPCError({ message: `User ${id} not found`, code: "NOT_FOUND" });
  }
  return user;
}

export function validateDataPermission(
  session: { user: { id: string; roles: Role[] } },
  data: { createdById: string } | { userId: string },
  permission: keyof typeof PERMISSIONS,
  additionalCheck?: () => boolean,
) {
  const dataUserId = "userId" in data ? data.userId : data.createdById;
  if (
    !hasPermission(session, permission) &&
    dataUserId !== session.user.id &&
    (!additionalCheck || !additionalCheck())
  ) {
    throw new TRPCError({
      message: "Permission denied",
      code: "FORBIDDEN",
    });
  }
}

export async function getUserWalletMust(id: string) {
  let wallet = await db.wallet.findUnique({
    where: { userId: id },
  });
  if (!wallet) {
    wallet = await db.wallet.create({
      data: {
        userId: id,
      },
    });
  }
  return wallet;
}

export async function getWaitWithdrawalAmount(id: string) {
  const waitWithdrawalAmount = await db.withdrawal.aggregate({
    where: {
      userId: id,
      status: "CREATED",
    },
    _sum: {
      amount: true,
    },
  });
  return waitWithdrawalAmount._sum.amount ?? new Decimal(0);
}

export async function validateUserConsumableBalance(id: string) {
  const wallet = await getUserWalletMust(id);
  if (wallet.balance.cmp(new Decimal(1)) < 0) {
    throw new Error(
      "Insufficient balance! You must have at least $1 to start this.",
    );
  }
}

export const updateUserWalletSchema = z.object({
  id: z.string(),
  amount: z.number(),
  extra: z.string().optional(),
  balanceType: z.nativeEnum(BalanceType).default("CONSUMPTION"),
  type: z.nativeEnum(BalanceLogType).default("DEFAULT"),
});

export async function updateUserWallet(
  params: z.infer<typeof updateUserWalletSchema> & { relatedInfo?: any },
) {
  const { id, extra, balanceType, type, relatedInfo } = params;
  let wallet = await getUserWalletMust(id);
  const amount = new Decimal(params.amount);
  const balance = (
    balanceType === BalanceType.CONSUMPTION
      ? wallet.balance
      : wallet.incomeBalance
  ).plus(amount);
  if (balance.isNegative()) {
    throw new Error("Insufficient balance");
  }

  const updateInput: WalletUpdateInput = {};
  if (balanceType === BalanceType.CONSUMPTION) {
    updateInput.balance = balance;
  } else {
    updateInput.incomeBalance = balance;
  }
  wallet = await db.wallet.update({
    where: { userId: id },
    data: updateInput,
  });
  await db.balanceLog.create({
    data: {
      userId: id,
      amount: amount,
      afterBalance: balance,
      balanceType: balanceType,
      type: type,
      extra: extra,
      relatedInfo: relatedInfo,
    },
  });
  return wallet;
}
