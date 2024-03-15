import globalLogger from "~/server/logger";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { handleGostObserver, ObserverSchema } from "~/server/core/gost";

const logger = globalLogger.child({ module: "agent-gost-observer" });

export async function POST(req: NextRequest) {
  try {
    const signature = req.nextUrl.searchParams.get("sign");
    if (!signature) {
      return new Response("Missing signature", {
        status: 400,
      });
    }
    const body = await req.json();
    logger.debug({ body, signature }, "Received observer request");
    const parameters = ObserverSchema.parse(body);
    return Response.json(await handleGostObserver(parameters, signature));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.errors), {
        status: 400,
      });
    }
    logger.error(error, "Failed to handle gost observer request");
    return new Response("Failed to handle gost observer request", {
      status: 400,
    });
  }
}
