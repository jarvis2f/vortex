import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { type Log, Prisma } from ".prisma/client";
import { parseJsonQuery } from "~/lib/utils";
import LogWhereInput = Prisma.LogWhereInput;
import JsonFilter = Prisma.JsonFilter;

const logSearchSchema = z.object({
  agentId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  levels: z.array(z.number()).optional(),
  jql: z.boolean().default(false),
  keyword: z.string().optional(),
});

export const logRouter = createTRPCRouter({
  getLogs: protectedProcedure
    .input(
      logSearchSchema.extend({
        limit: z.number().min(-100).max(100).default(30),
        cursor: z.number().nullish(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { limit, cursor } = input;
      const where = convertSearch2Where(input);
      const logs = await ctx.db.log.findMany({
        take: limit,
        skip: cursor ? 1 : 0,
        where: where,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          id: "desc",
        },
      });

      let nextCursor: number | undefined = undefined;
      if (logs.length >= limit) {
        const minId = await ctx.db.log.findFirst({
          where: where,
          orderBy: {
            id: "asc",
          },
        });
        const nextLog = logs[logs.length - 1];
        if (nextLog && minId && nextLog.id > minId.id) {
          nextCursor = nextLog.id;
        }
      }
      return {
        logs,
        nextCursor,
      };
    }),

  getLogGlance: protectedProcedure
    .input(logSearchSchema)
    .query(async ({ input, ctx }) => {
      const { startDate, endDate } = input;
      const where = convertSearch2Where(input);
      const logs = await ctx.db.log.findMany({
        where: where,
        orderBy: {
          id: "asc",
        },
      });

      if (logs.length === 0) {
        return {
          timeAxis: [],
          timeAxisData: [],
        };
      }

      const earliestTime = startDate ?? logs[0]!.time;
      const latestTime = endDate ?? new Date();

      const timeAxis = [];
      const timeLength = latestTime.getTime() - earliestTime.getTime();
      const timeInterval = Math.floor(timeLength / 10);
      for (let i = 0; i < 10; i++) {
        timeAxis.push(new Date(earliestTime.getTime() + timeInterval * i));
      }
      timeAxis.push(latestTime);

      const timeAxisData = [];
      for (let i = 0; i < timeAxis.length - 1; i++) {
        const startTime = timeAxis[i]!;
        const endTime = timeAxis[i + 1]!;
        const timeInterval = Math.floor(
          (endTime.getTime() - startTime.getTime()) / 6,
        );
        for (let j = 0; j < 6; j++) {
          const start = new Date(startTime.getTime() + timeInterval * j);
          const end = new Date(startTime.getTime() + timeInterval * (j + 1));
          const count = logs.filter(
            (log: Log) => log.time >= start && log.time < end,
          ).length;
          timeAxisData.push({
            start,
            end,
            count,
          });
        }
      }
      return {
        timeAxis,
        timeAxisData,
      };
    }),

  deleteLogs: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.log.deleteMany();
  }),
});

function convertSearch2Where(input: z.infer<typeof logSearchSchema>) {
  const { startDate, endDate, levels, agentId, jql, keyword } = input;

  let jsonFilter: JsonFilter<"Log"> | undefined = undefined;

  if (keyword) {
    if (jql) {
      jsonFilter = parseJsonQuery(keyword);
    } else {
      jsonFilter = {
        path: ["msg"],
        string_contains: keyword,
      };
    }
  }

  const where: LogWhereInput = {
    AND: [
      startDate ? { time: { gte: startDate } } : {},
      endDate ? { time: { lte: endDate } } : {},
      levels && levels.length > 0 ? { level: { in: levels } } : {},
      agentId
        ? {
            message: {
              path: ["module"],
              equals: `agent/${agentId}`,
            },
          }
        : {},
      jsonFilter ? { message: { ...jsonFilter } } : {},
    ],
  };

  return where;
}
