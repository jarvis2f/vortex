import { Payment } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { userStub } from "./user.stub";

export const paymentStub = {
  createdPayment: Object.freeze<Payment>({
    id: "payment-id",
    userId: userStub.user.id,
    amount: new Decimal(0),
    targetAmount: new Decimal(1),
    paymentInfo: {},
    callback: [],
    status: "CREATED",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
};
