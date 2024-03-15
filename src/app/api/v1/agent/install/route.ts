import { type NextRequest } from "next/server";
import { z } from "zod";
import { handleInstall } from "src/server/core/agent";
import globalLogger from "~/server/logger";

const logger = globalLogger.child({ module: "agent-install" });
const InstallSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  signature: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, key, signature } = InstallSchema.parse(body);
    return Response.json(await handleInstall(id, key, signature));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.errors), {
        status: 400,
      });
    }
    logger.error(error, "Failed to install agent");
    return new Response("Contact administrator", {
      status: 400,
    });
  }
}
