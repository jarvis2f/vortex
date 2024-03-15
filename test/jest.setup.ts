import { PrismaClient } from "@prisma/client";
import { DeepMockProxy, mockDeep, mockReset } from "jest-mock-extended";
import { db, redis, subRedis } from "../src/server/db";
import Redis from "ioredis";

jest.mock("../src/server/db", () => ({
  __esModule: true,
  db: mockDeep<PrismaClient>(),
  redis: mockDeep<Redis>(),
  subRedis: mockDeep<Redis>(),
}));

beforeEach(() => {
  mockReset(dbMock);
  mockReset(redisMock);
  mockReset(subRedisMock);
});

export const dbMock = db as unknown as DeepMockProxy<PrismaClient>;
export const redisMock = redis as unknown as DeepMockProxy<Redis>;
export const subRedisMock = subRedis as unknown as DeepMockProxy<Redis>;
