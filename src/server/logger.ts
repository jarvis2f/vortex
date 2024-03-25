import path from "path";
import pino, { type Logger } from "pino";
import "pino-abstract-transport";

const targets = [];

if (process.env.NODE_ENV === "production") {
  targets.push({
    target: path.join(process.cwd(), "./src/lib/pino-prisma.mjs"),
    options: {},
    level: "trace",
  });
} else {
  targets.push({
    target: "pino-pretty",
    options: {
      colorize: true,
      ignore: "hostname,pid",
    },
    level: "trace",
  });
}

const logger: Logger = pino({
  transport: {
    targets: targets,
  },
  level: "trace",
});

process.on("uncaughtException", (err) => {
  if (err.message === "the worker has exited") {
    return;
  }
  console.error(err);
  if (logger) logger.fatal(err, "uncaught exception detected");
});

process.on("unhandledRejection", (err) => {
  console.error(err);
  if (logger) logger.fatal(err, "unhandled rejection detected");
});

export default logger;
