import { getConfig, saveConfig } from "~/server/core/config";
import { type Forward, type Prisma } from ".prisma/client";
import {
  type ProxyProtocol,
  type ConnectConfig,
  type ForwardOptions,
} from "~/lib/types/agent";
import { z } from "zod";
import { env } from "~/env";
import { distributeTask } from "~/server/core/agent-task";
import { generateSignature, isIpv6, validateSignature } from "~/lib/utils";
import { getForwardMust, saveForwardTraffic } from "~/server/core/forward";
import { db, redis } from "~/server/db";
import { getAgentMust } from "~/server/core/agent";
import logger from "~/server/logger";

interface GostConfig {
  services?: Service[]; // 服务列表
  chains?: Chain[]; // 转发链列表
  authers?: Auther[]; // 认证器列表
  admissions?: Admission[]; // 准入控制器列表
  bypasses?: Bypass[]; // 分流器列表
  resolvers?: Resolver[]; // 域名解析器列表
  hosts?: Hosts[]; // 主机映射器列表
  tls?: TLS; // TLS配置
  log?: Log; // 日志配置
  profiling?: Profiling; // 性能分析配置
  api?: API; // API配置
  metrics?: Metrics; // Metrics配置
  observers?: Observer[]; // 观察器列表
  limiters?: Limiter[]; // 流量速率限制列表
  rlimiters?: Limiter[]; // 请求速率限制列表
  climiters?: Limiter[]; // 并发连接数限制列表
}

// 服务配置
interface Service {
  name: string; // 服务名称
  addr: string; // 服务地址
  interface?: string; // 网络接口名或IP地址
  sockopts?: SockOpts; // Socket参数
  admission?: string; // 准入控制器名称
  bypass?: string; // 分流器名称
  resolver?: string; // 域名解析器名称
  hosts?: string; // 主机映射器名称
  handler: Handler; // 处理器对象
  listener: Listener; // 监听器对象
  forwarder?: Forwarder; // 转发器对象
  observer?: string; // 观察器名称
  limiter?: string; // 流量速率限速器名称
  rlimiter?: string; // 请求速率限制器名称
  climiter?: string; // 并发连接数限制器名称
  metadata?: Record<string, any>; // 其他参数
}

// 处理器配置
interface Handler {
  type: string; // 处理器类型
  auther?: string; // 认证器名称 authers.name
  auth?: Auth; // 认证信息
  chain?: string; // 转发链名称 chains.name
  retries?: number; // 重试次数
  observer?: string; // 观察器名称
  metadata?: Record<string, any>; // 其他参数
}

// 监听器配置
interface Listener {
  type: string; // 监听器类型
  chain?: string; // 转发链名称
  auther?: string; // 认证器名称
  auth?: Auth; // 认证信息
  tls?: TLS; // TLS配置
  metadata?: Record<string, any>; // 其他参数
}

// 转发器配置
interface Forwarder {
  nodes: Node[]; // 转发目标节点列表
  selector?: Selector; // 负载均衡策略
}

// 转发链配置
interface Chain {
  name: string; // 转发链名称
  selector?: Selector; // 节点选择器
  hops: Hop[]; // 跳跃点列表
}

// 跳跃点配置
interface Hop {
  name: string; // 跳跃点名称
  interface?: string; // 网络接口名或IP地址
  sockopts?: SockOpts; // Socket参数
  selector?: Selector; // 节点选择器
  bypass?: string; // 分流器名称
  nodes: Node[]; // 节点列表
}

// 节点配置
interface Node {
  name: string; // 节点名称
  addr: string; // 节点地址
  interface?: string; // 网络接口名或IP地址
  sockopts?: SockOpts; // Socket参数
  bypass?: string; // 分流器名称
  connector?: Connector; // 连接器对象
  dialer?: Dialer; // 拨号器对象
}

// 连接器配置
interface Connector {
  type: string; // 连接器类型
  auth?: Auth; // 认证信息
  metadata?: Record<string, any>; // 其他参数
}

// 拨号器配置
interface Dialer {
  type: string; // 拨号器类型
  auth?: Auth; // 认证信息
  tls?: TLS; // TLS配置
  metadata?: Record<string, any>; // 其他参数
}

// TLS配置
interface TLS {
  certFile?: string; // 证书公钥文件
  keyFile?: string; // 证书私钥文件
  caFile?: string; // CA证书文件
  secure?: boolean; // 启用SSL/TLS
  serverName?: string; // 服务器域名
}

// 认证器配置
interface Auther {
  name: string; // 认证器名称
  auths: Auth[]; // 认证信息列表
}

// 认证信息配置
interface Auth {
  username?: string; // 用户名
  password?: string; // 密码
}

// 节点选择器配置
interface Selector {
  strategy?: string; // 选择策略
  maxFails?: number; // 最大失败次数
  failTimeout?: string; // 失败超时时长
}

// 准入控制器配置
interface Admission {
  name: string; // 准入控制器名称
  whitelist?: boolean; // 是否为白名单
  matchers: string[]; // 地址匹配器
}

// 分流器配置
interface Bypass {
  name: string; // 分流器名称
  whitelist?: boolean; // 是否为白名单
  matchers: string[]; // 地址匹配器
}

// 域名解析器配置
interface Resolver {
  name: string; // 域名解析器名称
  nameservers: Nameserver[]; // 域名服务器列表
}

// 域名服务器配置
interface Nameserver {
  addr: string; // 域名服务器地址
  chain?: string; // 转发链名称
  prefer?: string; // IP地址类型优先级
  clientIP?: string; // 客户端IP
  ttl?: string; // DNS缓存有效期
  timeout?: string; // DNS请求超时时长
}

// 主机映射器配置
interface Hosts {
  name: string; // 映射表名称
  mappings: Mapping[]; // 映射列表
}

// 映射列表项配置
interface Mapping {
  ip: string; // IP地址
  hostname: string; // 主机名
  aliases?: string[]; // 主机别名
}

// Socket参数配置
interface SockOpts {
  mark?: number; // Linux Socket SO_MARK参数
}

// 日志配置
interface Log {
  level?: string; // 日志级别
  format?: string; // 日志格式
  output?: string; // 日志输出方式
  rotation?: LogRotation; // 日志轮转配置
}

// 日志轮转配置
interface LogRotation {
  maxSize?: number; // 文件最大大小
  maxAge?: number; // 最大保存天数
  maxBackups?: number; // 最大备份数量
  localTime?: boolean; // 是否使用本地时间
  compress?: boolean; // 是否压缩
}

// 性能分析配置
interface Profiling {
  addr?: string; // 服务地址
  enabled?: boolean; // 是否启用
}

// API配置
interface API {
  addr?: string; // WebAPI服务地址
  pathPrefix?: string; // API路径前缀
  accesslog?: boolean; // 是否开启访问日志
  auth?: Auth; // 认证信息
  auther?: string; // 认证器名称
}

// Metrics配置
interface Metrics {
  addr?: string; // 服务地址
  path?: string; // 访问路径
}

interface Plugin {
  type: string; // 插件类型
  addr: string; // 地址
  tls?: TLS; // TLS配置
  timeout?: number; // 超时时长
  token?: string; // 访问令牌
}

interface Observer {
  name: string; // 观察器名称
  plugin: Plugin; // 插件配置
}

interface Limiter {
  name: string; // 限速器名称
  limits: string[]; // 限速规则列表
}

interface Gost {
  config: GostConfig;
  addForward: (forward: Forward) => void | Promise<void>;
  removeForward: (forward: Forward) => void | Promise<void>;
  afterForwardSucceededUpdatePort: (forward: Forward) => void | Promise<void>;
  setObserver: () => void | Promise<void>;
}

// 根据协议类型和代理协议生成handler对象
function createHandler(
  protocol: string,
  proxyProtocol: ProxyProtocol,
): Handler {
  let handlerType: string;

  if (proxyProtocol.enabled) {
    // 如果启用了代理协议，使用rtcp或rudp
    handlerType = protocol === "udp" ? "rudp" : "rtcp";
  } else {
    // 否则使用标准类型
    handlerType = protocol === "udp" ? "udp" : "tcp";
  }

  const handler: Handler = {
    type: handlerType,
  };

  // 如果启用了代理协议，添加元数据
  if (proxyProtocol.enabled) {
    handler.metadata = {
      proxyProtocol: proxyProtocol.version,
    };
  }

  return handler;
}

// 根据协议类型、通道和代理协议生成listener对象
function createListener(
  protocol: string,
  channel: string,
  proxyProtocol: ProxyProtocol,
): Listener {
  let listenerType: string;

  if (proxyProtocol.enabled) {
    // 如果启用了代理协议，使用rtcp或rudp
    listenerType = protocol === "udp" ? "rudp" : "rtcp";
  } else {
    // 否则使用标准类型
    listenerType = protocol === "udp" ? "udp" : channel || "tcp";
  }

  const listener: Listener = {
    type: listenerType,
  };

  // 如果启用了代理协议，添加元数据
  if (proxyProtocol.enabled) {
    listener.metadata = {
      proxyProtocol: proxyProtocol.version,
    };
  }

  return listener;
}

// 根据代理协议生成metadata对象
function createMetadata(proxyProtocol: ProxyProtocol): Record<string, any> {
  const metadata: Record<string, any> = {
    enableStats: true,
  };

  if (proxyProtocol.enabled) {
    metadata.proxyProtocol = proxyProtocol.version;
  }

  return metadata;
}

// 创建TCP服务配置
function createTcpService(
  f: Forward,
  targetAddress: string,
  options: ForwardOptions,
): Service {
  const { proxyProtocol = { enabled: false, version: "2" } } = options;

  return {
    name: `forward-tcp-${f.id}`,
    addr: f.agentPort === 0 ? `${f.id}-agentPort` : `:${f.agentPort}`,
    observer: "agent-observer",
    handler: createHandler("tcp", proxyProtocol),
    listener: createListener("tcp", "tcp", proxyProtocol),
    metadata: createMetadata(proxyProtocol),
    forwarder: {
      nodes: [
        {
          name: `node-tcp-${f.id}`,
          addr: targetAddress,
          connector: { type: "tcp" },
        },
      ],
    },
  };
}

// 创建UDP服务配置
function createUdpService(
  f: Forward,
  targetAddress: string,
  options: ForwardOptions,
): Service {
  const { proxyProtocol = { enabled: false, version: "2" } } = options;

  return {
    name: `forward-udp-${f.id}`,
    addr: f.agentPort === 0 ? `${f.id}-agentPort-udp` : `:${f.agentPort}`,
    observer: "agent-observer",
    handler: createHandler("udp", proxyProtocol),
    listener: createListener("udp", "udp", proxyProtocol),
    metadata: createMetadata(proxyProtocol),
    forwarder: {
      nodes: [
        {
          name: `node-udp-${f.id}`,
          addr: targetAddress,
          connector: { type: "udp" },
        },
      ],
    },
  };
}

// 创建带转发链的服务配置
function createChainService(
  f: Forward,
  targetAddress: string,
  options: ForwardOptions,
  config: GostConfig,
): Service {
  const { channel = "tcp", proxyProtocol = { enabled: false, version: "2" } } =
    options; // 移除未使用的listen变量

  // 判断协议类型
  const protocol = channel.includes("udp") ? "udp" : "tcp";

  // 确保chains数组存在
  config.chains = config.chains ?? []; // 使用nullish合并运算符替代逻辑或

  // 创建转发链
  const chain: Chain = {
    name: `chain-${f.id}`,
    hops: [
      {
        name: `hop-${f.id}`,
        nodes: [
          {
            name: `node-${f.id}`,
            addr: targetAddress,
            connector: { type: "relay" },
            dialer: {
              type: channel,
              tls: { serverName: f.target },
            },
          },
        ],
      },
    ],
  };

  // 添加链
  config.chains.push(chain);

  // 创建服务
  const service: Service = {
    name: `forward-${f.id}`,
    addr: f.agentPort === 0 ? `${f.id}-agentPort` : `:${f.agentPort}`,
    observer: "agent-observer",
    handler: createHandler(protocol, proxyProtocol),
    listener: createListener(protocol, channel, proxyProtocol),
    metadata: createMetadata(proxyProtocol),
  };

  // 设置服务的链引用
  service.handler.chain = chain.name;

  return service;
}

const Gost = async (agentId: string): Promise<Gost> => {
  const config = await getConfig({
    key: "AGENT_GOST_CONFIG",
    relationId: agentId,
  });
  const gost: Gost = {
    config,
    addForward: async (f: Forward) => {
      const target = f.target;
      // 如果是转发到Agent，目标agent需要添加一个相同协议的监听端口（目标端口）
      if (!gost.config) {
        gost.config = {};
      }
      if (!gost.config.services) {
        gost.config.services = [];
      }

      // 提取channel选项
      const { channel } = f.options as ForwardOptions;

      // 构建目标地址
      const targetAddress = isIpv6(target)
        ? `[${target}]:${f.targetPort}`
        : `${target}:${f.targetPort}`;

      // 根据是否存在channel决定创建服务的方式
      if (channel) {
        // 有channel参数，创建带转发链的服务
        const service = createChainService(
          f,
          targetAddress,
          f.options as ForwardOptions,
          gost.config,
        );
        gost.config.services.push(service);
      } else {
        // 没有channel参数，创建TCP和UDP服务
        const tcpService = createTcpService(
          f,
          targetAddress,
          f.options as ForwardOptions,
        );
        const udpService = createUdpService(
          f,
          targetAddress,
          f.options as ForwardOptions,
        );

        gost.config.services.push(tcpService, udpService);
      }

      await saveConfig("AGENT_GOST_CONFIG", gost.config, agentId);
    },
    removeForward: async (forward: Forward) => {
      if (!gost.config?.services) {
        return;
      }

      // 获取需要移除的服务名称
      const serviceNamesToRemove = [
        `forward-${forward.id}`, // 标准名称 (旧版格式)
        `forward-tcp-${forward.id}`, // TCP 服务名称
        `forward-udp-${forward.id}`, // UDP 服务名称
      ];

      // 移除所有相关服务
      gost.config.services = gost.config.services.filter(
        (service) => !serviceNamesToRemove.includes(service.name),
      );

      gost.config.chains = gost.config.chains?.filter(
        (chain) => chain.name !== `chain-${forward.id}`,
      );
      await saveConfig("AGENT_GOST_CONFIG", gost.config, agentId);
    },
    afterForwardSucceededUpdatePort: async (f: Forward) => {
      if (f.agentPort === 0) {
        return;
      }
      gost.config.services = gost.config.services?.map((service) => {
        if (
          service.name === `forward-${f.id}` &&
          service.addr === `${f.id}-agentPort`
        ) {
          service.addr = `:${f.agentPort}`;
        }
        return service;
      });
      await saveConfig("AGENT_GOST_CONFIG", gost.config, agentId);
    },
    setObserver: async () => {
      if (!gost.config) {
        gost.config = {};
      }
      const agent = await getAgentMust(agentId);
      const connectConfig = agent.connectConfig as unknown as ConnectConfig;
      const sign = await generateSignature(agentId, connectConfig.secret);
      gost.config.observers = [
        {
          name: "agent-observer",
          plugin: {
            type: "http",
            addr: `${env.SERVER_URL}/api/v1/agent/gost/observer?sign=${sign}`,
          },
        },
      ];
      logger.debug("set gost observer", gost.config);
      await saveConfig("AGENT_GOST_CONFIG", gost.config, agentId);
      await distributeTask({
        agentId,
        task: {
          type: "config_change",
          id: "",
          key: "AGENT_GOST_CONFIG",
          value: JSON.stringify(gost.config),
        },
      });
    },
  };
  return gost;
};

export const ObserverSchema = z.object({
  events: z.array(
    z.object({
      kind: z.string().refine((val) => val === "service" || val === "handler", {
        message: "kind must be 'service' or 'handler'",
      }),
      service: z.string(),
      type: z.string().refine((val) => val === "status" || val === "stats", {
        message: "type must be 'status' or 'stats'",
      }),
      status: z
        .object({
          state: z
            .string()
            .refine(
              (val) => ["running", "ready", "failed", "closed"].includes(val),
              {
                message:
                  "status.state must be 'running', 'ready', 'failed', or 'closed'",
              },
            ),
          msg: z.string(),
        })
        .optional(),
      stats: z
        .object({
          totalConns: z.number().int().positive(),
          currentConns: z.number().int().nonnegative(),
          inputBytes: z.number().int().nonnegative(),
          outputBytes: z.number().int().nonnegative(),
          totalErrs: z.number().int().nonnegative(),
        })
        .optional(),
    }),
  ),
});

type ObserverParameters = z.infer<typeof ObserverSchema>;

export async function handleGostObserver(
  parameters: ObserverParameters,
  signature: string,
) {
  const events = parameters.events;
  if (!events || events.length === 0 || events[0]!.kind !== "service") {
    throw new Error("Invalid events");
  }

  // 解析服务名称中的转发ID
  const serviceName = events[0]!.service;
  let forwardId: string | undefined;

  // 支持新旧两种服务命名格式
  if (
    serviceName.startsWith("forward-tcp-") ||
    serviceName.startsWith("forward-udp-")
  ) {
    forwardId = serviceName.split("-")[2]; // 新格式: forward-tcp-id 或 forward-udp-id
  } else {
    forwardId = serviceName.split("-")[1]; // 旧格式: forward-id
  }

  if (!forwardId) {
    logger.error(
      `Invalid service name format: ${serviceName}, original events: ${JSON.stringify(
        events,
      )}`,
    );
    throw new Error(`Invalid service name format: ${serviceName}`);
  }

  const forward = await getForwardMust(forwardId);
  const agent = await getAgentMust(forward.agentId);
  const connectConfig = agent.connectConfig as unknown as ConnectConfig;
  if (
    !(await validateSignature({
      payload: agent.id,
      signature,
      secret: connectConfig.secret,
    }))
  ) {
    throw new Error("Invalid signature");
  }
  const now = new Date();
  const forwardTrafficList: Record<
    string,
    Prisma.ForwardTrafficCreateManyInput[]
  > = {};
  for (const event of events) {
    if (event.kind !== "service") {
      continue;
    }

    forwardId = event.service.split("-")[2]!;
    const forward = await getForwardMust(forwardId);

    if (event.type === "status" && event.status) {
      // 每一次ready之后请求的流量都会从0开始，记录之前的流量
      if (event.status.state === "ready") {
        await redis.hset("forward_gost_cycle_traffic", {
          [forwardId]: JSON.stringify({
            download: forward.download,
            upload: forward.upload,
          }),
        });
      }
    } else if (event.type === "stats" && event.stats) {
      if (forward.updatedAt > now) {
        continue;
      }
      const cycleTrafficJson = await redis.hget(
        "forward_gost_cycle_traffic",
        forwardId,
      );
      let { inputBytes, outputBytes } = event.stats;
      if (cycleTrafficJson) {
        const cycleTraffic = JSON.parse(cycleTrafficJson);
        inputBytes += cycleTraffic.download;
        outputBytes += cycleTraffic.upload;
      }
      const forwardTrafficInput: Prisma.ForwardTrafficCreateManyInput = {
        forwardId: forwardId,
        time: now,
        download: inputBytes - forward.download,
        upload: outputBytes - forward.upload,
      };
      forwardTrafficList[forwardId] = forwardTrafficList[forwardId] ?? [];
      forwardTrafficList[forwardId]!.push(forwardTrafficInput);
      await db.forward.update({
        where: { id: forwardId },
        data: {
          download: inputBytes,
          upload: outputBytes,
          usedTraffic: inputBytes + outputBytes,
        },
      });
    }
  }

  for (const [forwardId, traffics] of Object.entries(forwardTrafficList)) {
    await saveForwardTraffic({ forwardId, traffics });
  }

  return {
    success: true,
  };
}

export default Gost;

export type {
  GostConfig,
  Service,
  Handler,
  Listener,
  Forwarder,
  Chain,
  Hop,
  Node,
  Connector,
  Dialer,
  TLS,
  Auther,
  Auth,
  Selector,
  Admission,
  Bypass,
  Resolver,
  Nameserver,
  Hosts,
  Mapping,
  SockOpts,
  Log,
  LogRotation,
  Profiling,
  API,
  Metrics,
};
