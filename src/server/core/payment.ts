import { db } from "~/server/db";
import globalLogger from "~/server/logger";
import { Prisma } from ".prisma/client";
import PaymentUpdateInput = Prisma.PaymentUpdateInput;
import { Decimal } from "@prisma/client/runtime/library";
import { updateUserWallet } from "~/server/core/user";

const logger = globalLogger.child({ module: "payment" });

export async function handlePaymentEvent(data: any) {
  const paymentId = data.payload.paymentId as string;
  if (!paymentId) {
    logger.error({ data }, "payment event missing paymentId");
    return;
  }

  let payment = await getPaymentMust(paymentId);
  if (payment.status !== "CREATED") {
    logger.warn({ payment }, "payment status not CREATED");
    return;
  }

  const updateInput: PaymentUpdateInput = {};
  let successful = false;
  if (data.status === "success") {
    updateInput.status = "SUCCEEDED";
    updateInput.amount = new Decimal(data.amount as string);
    successful = true;
  } else if (data.status === "fail") {
    updateInput.status = "FAILED";
  }
  let callback = [];
  if (payment.callback) {
    callback = payment.callback as any;
  }
  callback.push(data);
  updateInput.callback = callback;
  updateInput.paymentInfo = data;

  if (Object.keys(updateInput).length !== 0) {
    payment = await db.payment.update({
      where: {
        id: paymentId,
      },
      data: updateInput,
    });
  }

  if (successful) {
    await updateUserWallet({
      id: payment.userId,
      amount: payment.amount.toNumber(),
      balanceType: "CONSUMPTION",
      type: "RECHARGE",
      extra: "充值",
      relatedInfo: {
        paymentId: payment.id,
      },
    });
  }
}

export async function getPaymentMust(id: string) {
  const payment = await db.payment.findUnique({
    where: {
      id,
    },
  });
  if (!payment) {
    throw new Error(`Payment ${id} not found`);
  }
  return payment;
}
