import {
  MonitorCheckIcon,
  MonitorIcon,
  MonitorXIcon,
  XSquareIcon,
} from "lucide-react";

export const locales = ["en", "zh"] as const;

export const Regexps = {
  ipv4: /^([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(\.([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3}$/,
  ipv6: /(^(?:(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}:([0-9A-Fa-f]{1,4}:)?[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){4}:([0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){3}:([0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){2}:([0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(([0-9A-Fa-f]{1,4}:){0,5}:((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(::([0-9A-Fa-f]{1,4}:){0,5}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|([0-9A-Fa-f]{1,4}::([0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:))$)|(^\[(?:(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}:([0-9A-Fa-f]{1,4}:)?[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){4}:([0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){3}:([0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){2}:([0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(([0-9A-Fa-f]{1,4}:){0,5}:((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(::([0-9A-Fa-f]{1,4}:){0,5}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|([0-9A-Fa-f]{1,4}::([0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:))]$)/i,
  domain: /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i,
};

export const AgentTaskTypeOptions = [
  {
    label: "心跳",
    value: "hello",
    icon: MonitorIcon,
  },
  {
    label: "配置变更",
    value: "config_change",
    icon: MonitorCheckIcon,
  },
  {
    label: "转发",
    value: "forward",
    icon: MonitorXIcon,
  },
  {
    label: "Shell",
    value: "shell",
    icon: MonitorIcon,
  },
  {
    label: "上报状态",
    value: "report_stat",
    icon: MonitorCheckIcon,
  },
  {
    label: "上报流量",
    value: "report_traffic",
    icon: MonitorXIcon,
  },
];

export const ForwardMethodOptions = [
  {
    label: "直连",
    value: "IPTABLES",
  },
  {
    label: "GOST隧道",
    value: "GOST",
  },
];

export const ForwardStatusOptions = [
  {
    label: "创建中",
    value: "CREATED",
    icon: MonitorIcon,
  },
  {
    label: "创建失败",
    value: "CREATED_FAILED",
    icon: XSquareIcon,
  },
  {
    label: "运行中",
    value: "RUNNING",
    icon: MonitorCheckIcon,
  },
  {
    label: "已停止",
    value: "STOPPED",
    icon: MonitorXIcon,
  },
];

export const ForwardTrafficDimensions = {
  forward: "forward",
  user: "user",
  network: "network",
  agent: "agent",
};

export const GostProtocolOptions = [
  {
    label: "Relay",
    value: "relay",
  },
];

export const GostChannelOptions = [
  {
    label: "TLS",
    value: "tls",
    description: "安全传输层协议（TLS）：通过TCP提供加密和安全通信机制。",
  },
  {
    label: "WS",
    value: "ws",
    description: "WebSocket协议：提供全双工通信渠道，适用于实时数据交换。",
  },
  {
    label: "WSS",
    value: "wss",
    description:
      "WebSocket over TLS：结合TLS的WebSocket，增强数据传输的安全性。",
  },
  {
    label: "GRPC",
    value: "grpc",
    description: "gRPC协议：高性能、跨语言的远程过程调用（RPC）框架。",
  },
  {
    label: "QUIC",
    value: "quic",
    description: "QUIC协议：提供更快速的连接建立和改进的拥塞控制机制。",
  },
  {
    label: "PHT",
    value: "pht",
    description: "PHT协议：一种高效的传输协议，专为低延迟和高吞吐量设计。",
  },
  {
    label: "PHTS",
    value: "phts",
    description: "PHT over TLS：结合TLS的PHT协议，提供更高的安全性和数据保护。",
  },
  {
    label: "KCP",
    value: "kcp",
    description: "KCP协议：一个快速可靠的ARQ协议，适用于网络游戏和流媒体。",
  },
];

export const PaymentStatusOptions = [
  {
    label: "CREATED",
    value: "CREATED",
  },
  {
    label: "SUCCEEDED",
    value: "SUCCEEDED",
  },
  {
    label: "FAILED",
    value: "FAILED",
  },
];

export const WithdrawalStatusOptions = [
  {
    label: "CREATED",
    value: "CREATED",
  },
  {
    label: "WITHDRAWAL",
    value: "WITHDRAWAL",
  },
];
