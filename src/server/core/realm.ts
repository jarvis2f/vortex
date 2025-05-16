import { type Forward } from ".prisma/client";
import { type Network } from "lucide-react";
import { type ForwardOptions } from "~/lib/types/agent";
import { db } from "~/server/db";
import logger from "~/server/logger";

interface RealmConfig {
  log?: Log; // 日志配置
  dns?: Dns; // dns列表
  network?: Network; // 网络配置
  endpoints?: Endpoint[]; // 转发列表
}

// 服务配置
interface Log {
  level: "off" | "error" | "warn" | "info" | "debug" | "trace"; // 日志级别
  output?: string; // 日志输出路径
}

//DNS配置
interface Dns {
  mode?:
    | "ipv4_only"
    | "ipv6_only"
    | "ipv4_and_ipv6"
    | "ipv4_then_ipv6"
    | "ipv6_then_ipv4"; // 模式
  protocol?: "tcp" | "udp" | "tcp_and_udp"; // 协议
  nameservers?: string[]; // DNS服务器列表
  min_ttl?: number; // 最小TTL
  max_ttl?: number; // 最大TTL
  cache_size?: number; // 缓存大小
}

interface Network {
  no_tcp: boolean; // 是否禁用TCP
  use_udp: boolean; // 是否启用UDP
  ipv6_only?: boolean; // 是否仅支持IPv6
  tcp_timeout?: number; // TCP超时时间
  udp_timeout?: number; // UDP超时时间
  send_proxy?: boolean; // 是否发送代理头
  send_proxy_version?: number; // 代理头版本
  accept_proxy?: boolean; // 是否接受代理头
  accept_proxy_timeout?: number; // 代理头超时时间
  tcp_keepalive?: boolean; // TCP保持连接
  tcp_keepalive_probe?: number; // TCP保持连接探测次数
}

interface Endpoint {
  listen: string; // 本地监听地址 0.0.0.0:8080
  remote: string; // 远程地址 8.8.8.8:9090
  network?: Network; // 网络配置
}

interface Realm {
  config: RealmConfig;
  addForward: (forward: Forward) => void | Promise<void>;
  removeForward: (forward: Forward) => void | Promise<void>;
}

const Realm = async (agentId: string): Promise<Realm> => {
  const config: RealmConfig = {
    log: {
      level: "warn",
    },
    endpoints: [],
  };
  const realm: Realm = {
    config,
    addForward: async (f: Forward) => {
      const {
        proxyProtocol = {
          enabled: false,
          version: "2",
          send: false,
          receive: false,
        },
      } = f.options as ForwardOptions;

      const network: Network = {
        no_tcp: false,
        use_udp: true,
        ...(proxyProtocol.enabled && {
          send_proxy: Boolean(proxyProtocol.send),
          accept_proxy: Boolean(proxyProtocol.receive),
          send_proxy_version: Number(proxyProtocol.version),
        }),
      };

      const endpoint: Endpoint = {
        listen: `0.0.0.0:${f.agentPort}`,
        remote: `${f.target}:${f.targetPort}`,
        network,
      };

      realm.config.endpoints?.push(endpoint);

      try {
        const forward = await db.realmConfig.create({
          data: {
            forwardId: f.id,
            agentId,
            config: JSON.parse(JSON.stringify(realm.config)),
          },
        });
        logger.debug("Realm addForward success", { forwardId: f.id, forward });
      } catch (error) {
        logger.error("Failed to add forward", { error, forwardId: f.id });
        throw error;
      }
    },
    removeForward: async (forward: Forward) => {
      if (!forward.id) {
        logger.error("forward id is empty", forward);
        return;
      }

      const forwardConfig = await db.realmConfig.delete({
        where: {
          forwardId: forward.id,
          agentId: agentId,
        },
      });
      logger.debug(`Realm removeForward`, forwardConfig);
    },
  };
  return realm;
};

export default Realm;

export type { RealmConfig, Log, Network, Dns, Endpoint };
