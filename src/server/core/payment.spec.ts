import { handlePaymentEvent } from "./payment";
import { paymentStub } from "../../../test/fixtures/payment.stub";
import { dbMock } from "../../../test/jest.setup";
import { updateUserWallet } from "./user";
import { walletStub } from "../../../test/fixtures/wallet.stub";
import { Decimal } from "@prisma/client/runtime/library";

jest.mock("~/server/core/user", () => ({
  updateUserWallet: jest.fn().mockImplementation(async () => walletStub.wallet),
}));

describe("payment", () => {
  describe("handlePaymentEvent", () => {
    const successfulData = {
      token: "0x0",
      amount: "0.9949",
      sender: "0x0",
      status: "success",
      payload: {
        paymentId: paymentStub.createdPayment.id,
      },
      receiver: "0x0",
      blockchain: "avalanche",
      commitment: "confirmed",
      created_at: "2024-03-05T05:32:13.312425Z",
      after_block: "1",
      transaction: "0x0",
      confirmed_at: "2024-03-05T05:32:15.612421Z",
      confirmations: 1,
    };
    it("should handle payment event correctly", async () => {
      dbMock.payment.findUnique.mockResolvedValue(paymentStub.createdPayment);
      dbMock.payment.update.mockResolvedValue({
        ...paymentStub.createdPayment,
        status: "SUCCEEDED",
        amount: new Decimal(successfulData.amount),
        callback: [successfulData],
        paymentInfo: successfulData,
      });
      await handlePaymentEvent(successfulData);
      expect(dbMock.payment.update).toHaveBeenCalledWith({
        where: {
          id: paymentStub.createdPayment.id,
        },
        data: {
          status: "SUCCEEDED",
          amount: new Decimal(successfulData.amount),
          callback: [successfulData],
          paymentInfo: successfulData,
        },
      });

      expect(updateUserWallet).toHaveBeenCalledWith({
        id: paymentStub.createdPayment.userId,
        amount: 0.9949,
        balanceType: "CONSUMPTION",
        type: "RECHARGE",
        extra: "充值",
        relatedInfo: {
          paymentId: paymentStub.createdPayment.id,
        },
      });
    });
  });
});
