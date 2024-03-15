import globalLogger from "~/server/logger";
import type { NextRequest } from "next/server";
import { verify } from "@depay/js-verify-signature";
import { env } from "~/env";
import { handlePaymentEvent } from "~/server/core/payment";

const logger = globalLogger.child({ module: "depay-event" });

export async function POST(req: NextRequest) {
  const data = await req.json();
  const signature = req.headers.get("x-signature");
  logger.debug({ signature, data }, "depay event");
  const verified = await verify({
    signature: signature,
    data: JSON.stringify(data),
    publicKey: env.DEPAY_PUBLIC_KEY,
  });
  if (!verified) {
    logger.error("depay event signature verification failed");
    return new Response("depay event signature verification failed", {
      status: 400,
    });
  }
  await handlePaymentEvent(data);
  return new Response("ok");
}
