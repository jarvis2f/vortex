import path from "path";
import pino, { type Logger } from "pino";
import "pino-abstract-transport";

const targets = [];

if (process.env.NODE_ENV === "production") {
  // targets.push({
  //   target: 'pino/file',
  //   options: {
  //     destination: path.join(process.cwd(), './app.log'),
  //   },
  //   level: 'trace',
  // })
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
  console.error(err);
  if (logger) logger.fatal(err, "uncaught exception detected");
});

process.on("unhandledRejection", (err) => {
  console.error(err);
  if (logger) logger.fatal(err, "unhandled rejection detected");
});

export default logger;
