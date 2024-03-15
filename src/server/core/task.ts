import { CronJob, CronTime } from "cron";
import { getConfig } from "~/server/core/config";
import {
  handleLog,
  handleStat,
  handleStatus,
  handleTraffic,
} from "~/server/core/agent";
import globalLogger from "~/server/logger";
import { CONFIG_KEYS } from "~/lib/constants/config";
import type { CONFIG_KEY } from "~/lib/types";

const logger = globalLogger.child({ module: "task" });

const JOB_NAMES = [
  "SERVER_AGENT_STAT_JOB",
  "SERVER_AGENT_STATUS_JOB",
  "SERVER_AGENT_LOG_JOB",
  "SERVER_AGENT_TRAFFIC_JOB",
] as const;

export type JOB_NAME = (typeof JOB_NAMES)[number];

class ServerTask {
  private jobs: Record<string, CronJob> = {};

  public async startJobs() {
    logger.debug("Starting jobs");
    await this.createJob("SERVER_AGENT_STAT_JOB", () => {
      void handleStat();
    }).catch((e) => {
      logger.error(
        `Error while creating job SERVER_AGENT_STAT_JOB: ${e.message}`,
      );
    });

    await this.createJob("SERVER_AGENT_STATUS_JOB", () => {
      void handleStatus();
    }).catch((e) => {
      logger.error(
        `Error while creating job SERVER_AGENT_STATUS_JOB: ${e.message}`,
      );
    });

    await this.createJob("SERVER_AGENT_LOG_JOB", () => {
      void handleLog();
    }).catch((e) => {
      logger.error(
        `Error while creating job SERVER_AGENT_LOG_JOB: ${e.message}`,
      );
    });

    await this.createJob("SERVER_AGENT_TRAFFIC_JOB", () => {
      void handleTraffic();
    }).catch((e) => {
      logger.error(
        `Error while creating job SERVER_AGENT_TRAFFIC_JOB: ${e.message}`,
      );
    });

    for (const name of Object.keys(this.jobs)) {
      this.jobs[name]!.start();
      logger.info(
        `Job ${name} started. ${String(this.jobs[name]!.cronTime.source)}`,
      );
    }
  }

  private async getJobCronTime(name: JOB_NAME, cronTime?: string) {
    const configKey = `${name}_CRON`;
    if (!cronTime && CONFIG_KEYS.includes(configKey as never)) {
      cronTime = await getConfig({ key: configKey as CONFIG_KEY });
    }
    if (!cronTime) {
      throw new Error(`Cron time not defined`);
    }
    return cronTime;
  }

  private async createJob(
    name: JOB_NAME,
    onTick: () => void,
    cronTime?: string,
  ) {
    cronTime = await this.getJobCronTime(name, cronTime);
    this.jobs[name] = new CronJob(cronTime, onTick);
  }

  public async setTime(name: JOB_NAME, cronTime?: string) {
    // TODO: runtime this.jobs is empty
    logger.debug(`job length: ${Object.keys(this.jobs).length}`);
    if (!this.jobs[name]) {
      throw new Error(`Job ${name} not found`);
    }
    cronTime = await this.getJobCronTime(name, cronTime);
    this.jobs[name]!.setTime(new CronTime(cronTime));
    logger.info(`Job ${name} set to ${cronTime}`);
  }
}

export const serverTask = new ServerTask();
