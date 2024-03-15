import { Wallet } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { userStub } from "./user.stub";

export const walletStub = {
  wallet: Object.freeze<Wallet>({
    id: "payment-id",
    balance: new Decimal(0),
    incomeBalance: new Decimal(0),
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: userStub.user.id,
  }),
};
