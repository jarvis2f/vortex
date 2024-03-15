import { createTRPCRouter } from "~/server/api/trpc";
import { rechargeCodeRouter, userRouter } from "~/server/api/routers/user";
import { agentRouter } from "~/server/api/routers/agent";
import { publicSystemRouter, systemRouter } from "~/server/api/routers/system";
import { forwardRouter } from "~/server/api/routers/forward";
import { logRouter } from "~/server/api/routers/log";
import { networkRouter } from "~/server/api/routers/network";
import { paymentRouter } from "~/server/api/routers/payment";
import { withdrawalRouter } from "~/server/api/routers/withdrawal";
import { ticketRouter } from "~/server/api/routers/ticket";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  rechargeCode: rechargeCodeRouter,
  payment: paymentRouter,
  withdrawal: withdrawalRouter,
  agent: agentRouter,
  system: systemRouter,
  forward: forwardRouter,
  network: networkRouter,
  log: logRouter,
  ticket: ticketRouter,
  publicSystem: publicSystemRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
