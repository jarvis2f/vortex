import {
  deductBalance,
  saveForwardTraffic,
  tempWaitDeductBalance,
} from "./forward";
import { dbMock, redisMock } from "../../../test/jest.setup";
import { forwardStub } from "../../../test/fixtures/forward.stub";
import { configStub } from "../../../test/fixtures/config.stub";
import { walletStub } from "../../../test/fixtures/wallet.stub";
import { updateUserWallet } from "./user";
import { agentStub } from "../../../test/fixtures/agent.stub";
import { BalanceLogType, BalanceType } from "@prisma/client";
import { forwardTrafficStub } from "../../../test/fixtures/forward-traffic.stub";
import { agentTaskStub } from "../../../test/fixtures/agent-task.stub";
import { distributeTask } from "./agent-task";
import { deleteNetwork } from "./network";

jest.mock("~/server/core/user", () => ({
  updateUserWallet: jest.fn().mockImplementation(async () => walletStub.wallet),
}));

jest.mock("~/server/core/agent-task", () => ({
  distributeTask: jest
    .fn()
    .mockImplementation(async () => agentTaskStub.helloTask.id),
  getTaskResult: jest
    .fn()
    .mockImplementation(async () => agentTaskStub.helloTask.result),
}));

jest.mock("~/server/core/network", () => ({
  deleteNetwork: jest.fn().mockImplementation(async () => ({
    id: "networkId",
  })),
}));

describe("forward", () => {
  describe("saveForwardTraffic", () => {
    it("should update last traffic if time is less than 2 minutes", async () => {
      dbMock.forward.findUnique.mockResolvedValue(forwardStub.forward);
      dbMock.forwardTraffic.findFirst.mockResolvedValue({
        ...forwardTrafficStub.kb,
      });

      await saveForwardTraffic({
        forwardId: forwardStub.forward.id,
        traffics: [forwardTrafficStub.kb],
      });

      expect(dbMock.forwardTraffic.createMany).toHaveBeenCalledTimes(0);
      expect(dbMock.forwardTraffic.update).toHaveBeenCalledTimes(1);

      expect(dbMock.forwardTraffic.update).toHaveBeenCalledWith({
        where: {
          id: forwardTrafficStub.kb.id,
        },
        data: {
          upload: 2048,
          download: 2048,
        },
      });
    });

    it("should create new traffic if time is more than 2 minutes", async () => {
      dbMock.forward.findUnique.mockResolvedValue(forwardStub.forward);
      dbMock.forwardTraffic.findFirst.mockResolvedValue(null);

      await saveForwardTraffic({
        forwardId: forwardStub.forward.id,
        traffics: [forwardTrafficStub.kb],
      });

      expect(dbMock.forwardTraffic.createMany).toHaveBeenCalledTimes(1);
      expect(dbMock.forwardTraffic.update).toHaveBeenCalledTimes(0);

      expect(dbMock.forwardTraffic.createMany).toHaveBeenCalledWith({
        data: [forwardTrafficStub.kb],
      });
    });

    it("should update last traffic and create new traffic for multiple traffics", async () => {
      dbMock.forward.findUnique.mockResolvedValue(forwardStub.forward);
      dbMock.forwardTraffic.findFirst.mockResolvedValue({
        ...forwardTrafficStub.kb,
      });
      const secondTraffic = {
        ...forwardTrafficStub.kb,
        time: new Date("2024-01-01T00:02:30Z"),
      };
      await saveForwardTraffic({
        forwardId: forwardStub.forward.id,
        traffics: [forwardTrafficStub.kb, secondTraffic],
      });

      expect(dbMock.forwardTraffic.createMany).toHaveBeenCalledTimes(1);
      expect(dbMock.forwardTraffic.update).toHaveBeenCalledTimes(1);

      expect(dbMock.forwardTraffic.update).toHaveBeenCalledWith({
        where: {
          id: forwardTrafficStub.kb.id,
        },
        data: {
          upload: 2048,
          download: 2048,
        },
      });

      expect(dbMock.forwardTraffic.createMany).toHaveBeenCalledWith({
        data: [secondTraffic],
      });
    });
  });

  describe("deductBalance", () => {
    it("should deduct balance correctly", async () => {
      dbMock.forward.findUnique.mockResolvedValue(forwardStub.forward);
      dbMock.config.findUnique.mockResolvedValue(configStub.trafficPrice);
      dbMock.agent.findUnique.mockResolvedValue(agentStub.agent);

      await deductBalance({
        forwardId: forwardStub.forward.id,
        startTime: new Date("2024-01-01T00:01:00Z"),
        endTime: new Date("2024-01-01T00:02:00Z"),
        traffic: 1024,
      });

      const relatedInfo = {
        forwardId: forwardStub.forward.id,
        startTime: new Date("2024-01-01T00:01:00Z"),
        endTime: new Date("2024-01-01T00:02:00Z"),
        traffic: 1024,
        convertedTraffic: 1,
        trafficPrice: {
          price: 0.01,
          unit: "Kilobytes",
        },
      };

      expect(updateUserWallet).toHaveBeenCalledTimes(2);
      expect(updateUserWallet).toHaveBeenNthCalledWith(1, {
        id: forwardStub.forward.createdById,
        amount: -0.01,
        balanceType: BalanceType.CONSUMPTION,
        type: BalanceLogType.TRAFFIC_CONSUMPTION,
        extra: `使用流量 1 KB 扣除`,
        relatedInfo: relatedInfo,
      });
      expect(updateUserWallet).toHaveBeenNthCalledWith(2, {
        id: agentStub.agent.createdById,
        amount: 0.01,
        balanceType: BalanceType.INCOME,
        type: BalanceLogType.TRAFFIC_INCOME,
        extra: `流量[ 1 KB ]收入`,
        relatedInfo: relatedInfo,
      });
    });

    it("should not deduct balance if traffic is less than 1 KB and time is less than 2 minutes", async () => {
      dbMock.forward.findUnique.mockResolvedValue(forwardStub.forward);
      dbMock.config.findUnique.mockResolvedValue(configStub.trafficPrice);

      await deductBalance({
        forwardId: forwardStub.forward.id,
        startTime: new Date("2024-01-01T00:01:00Z"),
        endTime: new Date("2024-01-01T00:02:00Z"),
        traffic: 100,
      });

      expect(updateUserWallet).toHaveBeenCalledTimes(0);
    });

    it("should delete forward if balance is not enough", async () => {
      dbMock.forward.findUnique.mockResolvedValue(forwardStub.forward);
      dbMock.config.findUnique.mockResolvedValue(configStub.trafficPrice);

      jest.mock("~/server/core/user", () => ({
        updateUserWallet: jest.fn().mockImplementation(async () => {
          throw new Error("Insufficient balance");
        }),
      }));

      await deductBalance({
        forwardId: forwardStub.forward.id,
        startTime: new Date("2024-01-01T00:01:00Z"),
        endTime: new Date("2024-01-01T00:01:30Z"),
        traffic: 1024,
      });

      expect(updateUserWallet).toHaveBeenCalledTimes(1);
      expect(distributeTask).toHaveBeenCalledTimes(1);
    });

    it("should delete network if balance is not enough", async () => {
      dbMock.forward.findUnique.mockResolvedValue(forwardStub.forward);
      dbMock.config.findUnique.mockResolvedValue(configStub.trafficPrice);
      dbMock.networkEdge.findFirst.mockResolvedValue({
        id: "edgeId",
        networkId: "networkId",
        sourceAgentId: "sourceAgentId",
        deleted: false,
        sourceForwardId: null,
        targetAgentId: null,
        nextEdgeId: null,
      });

      jest.mock("~/server/core/user", () => ({
        updateUserWallet: jest.fn().mockImplementation(async () => {
          throw new Error("Insufficient balance");
        }),
      }));

      await deductBalance({
        forwardId: forwardStub.forward.id,
        startTime: new Date("2024-01-01T00:01:00Z"),
        endTime: new Date("2024-01-01T00:02:00Z"),
        traffic: 1024,
      });

      expect(updateUserWallet).toHaveBeenCalledTimes(1);
      expect(deleteNetwork).toHaveBeenCalledTimes(1);
    });
  });

  describe("tempWaitDeductBalance", () => {
    it("should save wait deduct balance correctly", async () => {
      const history = {
        forwardId: "forwardId",
        startTime: "2024-01-01T00:01:00Z",
        endTime: "2024-01-01T00:02:00Z",
        traffic: 10,
      };
      redisMock.hget.mockResolvedValueOnce(JSON.stringify(history));

      const balanceParams = await tempWaitDeductBalance({
        forwardId: "forwardId",
        startTime: new Date("2024-01-01T00:03:00Z"),
        endTime: new Date("2024-01-01T00:04:00Z"),
        traffic: 10,
      });

      expect(balanceParams).toStrictEqual({
        forwardId: "forwardId",
        startTime: new Date("2024-01-01T00:01:00Z"),
        endTime: new Date("2024-01-01T00:04:00Z"),
        traffic: 20,
      });

      expect(redisMock.hset).toHaveBeenCalledTimes(1);
    });
  });
});
