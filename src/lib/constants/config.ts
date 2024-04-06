import { type CONFIG_KEY, type ConfigSchema } from "~/lib/types";
import { GO_LEVELS, LEVELS } from "~/lib/constants/log-level";
import { trafficPriceConfigFieldSchema } from "~/lib/constants/custom-component-config";

// cron pattern: https://crontab.cronhub.io/
export const CONFIG_KEYS = [
  "LOG_RETENTION_PERIOD", // 日志保留期限 (天)
  "LOG_RETENTION_LEVEL", // 日志保留等级 (@see log-level.ts)
  "ANNOUNCEMENT", // 公告
  "ENABLE_REGISTER", // 是否开启注册
  "SERVER_AGENT_STAT_JOB_CRON", // 服务器定时处理节点上报的状态数据
  "SERVER_AGENT_STATUS_JOB_CRON", // 服务器定时处理节点上下线状态
  "SERVER_AGENT_LOG_JOB_CRON", // 服务器定时处理节点上报的日志数据
  "SERVER_AGENT_TRAFFIC_JOB_CRON", // 服务器定时处理节点上报的流量数据
  "SERVER_AGENT_STAT_INTERVAL", // 服务器定时处理节点上报的状态数据时，持久化保存状态数据的间隔时间（秒）
  "TRAFFIC_PRICE", // 流量价格
  "RECHARGE_MIN_AMOUNT", // 最小充值金额
  "WITHDRAW_MIN_AMOUNT", // 最小提现金额
  "AGENT_SUPPORT_DIRECT", // 节点是否支持直连
  "AGENT_REPORT_STAT_JOB_CRON", // 节点定时上报状态数据
  "AGENT_REPORT_TRAFFIC_JOB_CRON", // 节点定时上报流量数据
  "AGENT_PORT_RANGE", // 节点中转端口范围 如：1024-49151
  "AGENT_GOST_CONFIG", // 节点GOST配置 TODO 这个是否不能在前端配置，只能查看？如果修改了会影响节点的服务。或者可以修改，但是需要重启服务？
  "AGENT_LOG_LEVEL", // 节点日志等级
] as const;

export const CONFIG_DEFAULT_VALUE_MAP: Record<
  CONFIG_KEY,
  number | string | boolean | object | undefined
> = {
  LOG_RETENTION_PERIOD: 3,
  LOG_RETENTION_LEVEL: 30,
  ANNOUNCEMENT: "",
  ENABLE_REGISTER: true,
  SERVER_AGENT_STAT_JOB_CRON: "*/2 * * * *",
  SERVER_AGENT_STATUS_JOB_CRON: "*/1 * * * *",
  SERVER_AGENT_LOG_JOB_CRON: "*/1 * * * *",
  SERVER_AGENT_TRAFFIC_JOB_CRON: "*/2 * * * *",
  SERVER_AGENT_STAT_INTERVAL: 5 * 60,
  TRAFFIC_PRICE: undefined,
  RECHARGE_MIN_AMOUNT: 1,
  WITHDRAW_MIN_AMOUNT: 10,
  AGENT_SUPPORT_DIRECT: false,
  AGENT_REPORT_STAT_JOB_CRON: "*/2 * * * *",
  AGENT_REPORT_TRAFFIC_JOB_CRON: "*/2 * * * *",
  AGENT_PORT_RANGE: "1024-49151",
  AGENT_GOST_CONFIG: undefined,
  AGENT_LOG_LEVEL: undefined,
};

export const COMMON_CONFIG_SCHEMA_MAP: Partial<
  Record<CONFIG_KEY, ConfigSchema>
> = {
  TRAFFIC_PRICE: trafficPriceConfigFieldSchema,
};

export const GLOBAL_CONFIG_SCHEMA_MAP: Partial<
  Record<CONFIG_KEY, ConfigSchema>
> = {
  LOG_RETENTION_PERIOD: {
    title: "日志保留时间",
    description:
      "日志在数据库中的保留时间，超过此时间的日志将被删除。（单位：天）",
    component: "select",
    type: "number",
    options: [
      { label: "1 天", value: "1" },
      { label: "3 天", value: "3" },
      { label: "7 天", value: "7" },
      { label: "15 天", value: "15" },
      { label: "30 天", value: "30" },
      { label: "60 天", value: "60" },
    ],
  },
  LOG_RETENTION_LEVEL: {
    title: "日志保留等级",
    description: "日志在数据库中的保留等级，低于此等级的日志将被删除。",
    component: "select",
    type: "number",
    options: LEVELS,
  },
  ENABLE_REGISTER: {
    title: "开启注册",
    description: "是否允许新用户注册账号。",
    component: "switch",
    type: "boolean",
  },
  ANNOUNCEMENT: {
    title: "公告",
    description: "系统公告，将显示在Dashboard页面，支持 Markdown 语法",
    component: "textarea",
    type: "markdown",
  },
  SERVER_AGENT_STAT_JOB_CRON: {
    title: "状态任务Cron",
    description:
      "Agent 状态处理任务的 cron pattern，用于定时处理 Agent 服务器状态数据。",
    component: "input",
    type: "cron",
  },
  SERVER_AGENT_STATUS_JOB_CRON: {
    title: "在线状态任务Cron",
    description:
      "Agent 状态处理任务的 cron pattern，用于定时处理 Agent 在线状态数据。",
    component: "input",
    type: "cron",
  },
  SERVER_AGENT_LOG_JOB_CRON: {
    title: "日志任务Cron",
    description:
      "Agent 日志处理任务的 cron pattern，用于定时处理 Agent 日志数据。",
    component: "input",
    type: "cron",
  },
  SERVER_AGENT_TRAFFIC_JOB_CRON: {
    title: "流量任务Cron",
    description:
      "Agent 流量处理任务的 cron pattern，用于定时处理 Agent 流量数据。",
    component: "input",
    type: "cron",
  },
  SERVER_AGENT_STAT_INTERVAL: {
    title: "状态存储间隔",
    description: "在执行状态处理任务时，持久化保存状态的间隔时间。（单位：秒）",
    component: "input",
    type: "number",
  },
  ...COMMON_CONFIG_SCHEMA_MAP,
  RECHARGE_MIN_AMOUNT: {
    title: "最小充值金额",
    description: "允许用户充值的最小金额。系统最小充值：0.01",
    component: "input",
    type: "number",
  },
  WITHDRAW_MIN_AMOUNT: {
    title: "最小提现金额",
    description: "允许用户申请提现的最小金额。",
    component: "input",
    type: "number",
  },
};

export const AGENT_CONFIG_SCHEMA_MAP: Partial<
  Record<CONFIG_KEY, ConfigSchema>
> = {
  ...COMMON_CONFIG_SCHEMA_MAP,
  AGENT_SUPPORT_DIRECT: {
    title: "支持直连",
    description: "节点是否支持直连。选择支持后，节点将支持直连转发。",
    component: "switch",
    type: "boolean",
  },
  AGENT_LOG_LEVEL: {
    title: "节点日志等级",
    description:
      "节点日志等级，用于控制节点日志的输出等级。节点重启后会失效，优先取本地配置。",
    component: "select",
    type: "number",
    options: GO_LEVELS,
  },
  AGENT_REPORT_STAT_JOB_CRON: {
    title: "节点状态上报任务Cron",
    description: "节点状态上报任务的 cron pattern，用于定时上报节点状态数据。",
    component: "input",
    type: "cron",
  },
  AGENT_REPORT_TRAFFIC_JOB_CRON: {
    title: "节点中转流量上报任务Cron",
    description:
      "节点流量上报任务的 cron pattern，用于定时上报节点中转流量数据。",
    component: "input",
    type: "cron",
  },
  AGENT_PORT_RANGE: {
    title: "节点端口范围",
    description: "节点中转端口范围，用于节点中转服务的端口分配。",
    component: "input",
    type: "string",
  },
  AGENT_GOST_CONFIG: {
    title: "Agent GOST 配置",
    description:
      "节点 GOST 配置，用于节点GOST服务 /etc/gost/config.json 的配置内容。",
    component: "textarea",
    type: "json",
  },
};
