export default async function pinoPrisma(opts) {
  console.log("Initializing pino-prisma");
  const { PrismaClient } = await import("@prisma/client");
  const build = await import("pino-abstract-transport").then((m) => m.default);
  const prisma = new PrismaClient();
  const config = await prisma.config.findUnique({
    where: {
      relationId_key: {
        key: "LOG_RETENTION_LEVEL",
        relationId: "0",
      },
    },
  });
  const level = parseInt(config?.value ?? "30");
  console.log(`Log retention level: ${level}`);
  // @ts-ignore
  return build(async function (source) {
    try {
      for await (const obj of source) {
        if (obj.level < level) {
          continue;
        }
        await prisma.log.create({
          data: {
            time: new Date(obj.time),
            level: obj.level,
            message: obj,
          },
        });
      }
    } catch (e) {
      console.error(e);
    }
  });
}
