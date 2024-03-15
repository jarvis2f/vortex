import { CONFIG_KEYS } from "~/lib/constants/config";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import * as z from "zod";
import { type CONFIG_KEY } from "~/lib/types";
import { type Prisma } from ".prisma/client";
import { getConfig, saveConfig } from "~/server/core/config";
import { TRPCError } from "@trpc/server";
import * as si from "systeminformation";
import { env } from "~/env";

const getConfigSchema = z
  .object({
    relationId: z.string().optional().default("0"),
    key: z.enum(CONFIG_KEYS),
  })
  .or(
    z.object({
      relationId: z.string().optional().default("0"),
      keys: z.array(z.enum(CONFIG_KEYS)),
    }),
  );

const PUBLIC_CONFIG_KEYS: CONFIG_KEY[] = ["ENABLE_REGISTER"];

export const publicSystemRouter = createTRPCRouter({
  getConfig: publicProcedure.input(getConfigSchema).query(async ({ input }) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const { key, keys } = input;
    if (key && !PUBLIC_CONFIG_KEYS.includes(key as CONFIG_KEY)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Forbidden",
      });
    }
    if (keys) {
      for (const k of keys) {
        if (!PUBLIC_CONFIG_KEYS.includes(k as CONFIG_KEY)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Forbidden",
          });
        }
      }
    }
    return handleGetConfig(input);
  }),
});

export const systemRouter = createTRPCRouter({
  getAllConfig: protectedProcedure
    .input(
      z
        .object({
          relationId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input, ctx }) => {
      const where: Prisma.ConfigWhereInput = {};
      if (input?.relationId) {
        where.relationId = input?.relationId;
      }
      return ctx.db.config.findMany({ where });
    }),

  getConfig: protectedProcedure
    .input(getConfigSchema)
    .query(async ({ input }) => handleGetConfig(input)),

  setConfig: protectedProcedure
    .input(
      z.object({
        key: z.enum(CONFIG_KEYS),
        value: z.string(),
        relationId: z.string().optional().default("0"),
      }),
    )
    .mutation(async ({ input }) => {
      //TODO: add permission check
      const { key, value, relationId } = input;
      await saveConfig(key, value, relationId);
    }),

  getSystemStatus: protectedProcedure.query(async () => {
    await si.currentLoad();
    await si.networkStats();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const currentLoad = await si.currentLoad();
    const networkStats = await si.networkStats();
    const mem = await si.mem();

    return {
      load: currentLoad.currentLoad,
      network: {
        download: networkStats[0]?.rx_sec,
        upload: networkStats[0]?.tx_sec,
      },
      mem: mem.used / mem.total,
    };
  }),

  getDePayIntegrationId: protectedProcedure.query(() => {
    const integrationId = env.DEPAY_INTEGRATION_ID;
    if (!integrationId) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "DEPAY_INTEGRATION_ID is not set",
      });
    }
    return integrationId;
  }),
});

async function handleGetConfig(input: z.infer<typeof getConfigSchema>) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const { key, keys, relationId } = input;
  const configs: Record<CONFIG_KEY, any> = {} as Record<CONFIG_KEY, any>;
  if (key) {
    configs[key as CONFIG_KEY] = await getConfig({
      key,
      relationId,
    });
  } else if (keys) {
    for (const k of keys) {
      configs[k as CONFIG_KEY] = await getConfig({
        key: k,
        relationId,
      });
    }
  } else {
    throw new Error("key or keys must be provided");
  }
  return configs;
}
