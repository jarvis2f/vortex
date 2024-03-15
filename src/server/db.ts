import { PrismaClient } from "@prisma/client";

import { env } from "~/env";
import Redis from "ioredis";
import { type Prisma } from ".prisma/client";

const globalForDB = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  redis: Redis | undefined;
  subRedis: Redis | undefined;
};

export const db =
  globalForDB.prisma ??
  new PrismaClient({
    log: /*env.NODE_ENV === "development" ? ["query", "error", "warn"] :*/ [
      "error",
    ],
  });

export const redis =
  globalForDB.redis ??
  new Redis(env.REDIS_URL, {
    username: env.REDIS_USERNAME,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
  });

export const subRedis =
  globalForDB.subRedis ??
  new Redis(env.REDIS_URL, {
    username: env.REDIS_USERNAME,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
    autoResubscribe: true,
  });

if (env.NODE_ENV !== "production") {
  globalForDB.prisma = db;
  globalForDB.redis = redis;
  globalForDB.subRedis = subRedis;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
db.$on<Prisma.QueryEvent>("query", (e: Prisma.QueryEvent) => {
  if (e.query.indexOf("Log") === -1) return;
  const originalQuery = e.query;
  const params = JSON.parse(e.params);
  let replacedQuery = originalQuery;
  for (const param of params) {
    replacedQuery = replacedQuery.replace("?", `'${param}'`);
  }
  console.log("Query:", replacedQuery);
});
