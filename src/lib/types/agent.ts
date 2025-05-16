import { type Edge, type Node } from "reactflow";
import type { ForwardMethod, ForwardTargetType } from ".prisma/client";

export interface InstallResponse {
  link: string;
}

export interface ConnectConfig {
  serverPrivateKey: string;
  serverPublicKey: string;
  secret: string;
  connectUsername: string;
  connectPassword: string;
}

export interface AgentInfo {
  version: string;
  platform: string;
  uptime: number;
  bootTime: number;
  platformVersion: string;
  kernelVersion: string;
  kernelArch: string;
  ip: {
    ipv4: string;
    ipv6: string;
    country: string;
  };
  cpu: {
    model: string;
    cores: number;
    speed: number;
  };
  memory: {
    total: number;
  };
  network: {
    totalDownload: number;
    totalUpload: number;
  };
}

export interface AgentStatRecord {
  cpu: {
    percent: number;
  };
  memory: {
    used: number;
  };
  network: {
    downloadSpeed: number;
    uploadSpeed: number;
    totalDownload: number;
    totalUpload: number;
  };
  time: number;
}

export const AGENT_TASK_TYPES = [
  "hello",
  "config_change",
  "forward",
  "shell",
  "ping",
  "report_stat",
  "report_traffic",
] as const;
export type AgentTaskType = (typeof AGENT_TASK_TYPES)[number];

export type AgentTaskBodyType =
  | AgentTask
  | AgentHelloTask
  | AgentConfigChangeTask
  | AgentShellTask
  | AgentForwardTask
  | AgentPingTask;

export interface AgentTask {
  id: string;
  type: AgentTaskType;
}

export interface AgentHelloTask extends AgentTask {
  type: "hello";
  mem?: boolean;
}

export interface AgentConfigChangeTask extends AgentTask {
  type: "config_change";
  key: string;
  value?: string;
}

export interface AgentShellTask extends AgentTask {
  type: "shell";
  shell: string;
  internal: boolean;
}

export interface AgentForwardTask extends AgentTask {
  type: "forward";
  action: "add" | "delete";
  method: string;
  options: string;
  forwardId: string;
  agentPort: number;
  targetPort: number;
  target: string;
}

export interface AgentPingTask extends AgentTask {
  type: "ping";
  host: string;
  count?: number;
  timeout?: number;
  agentPort?: number;
  forwardMethod?: string;
}

export interface AgentTaskResult {
  id: string;
  success: boolean;
  extra?: string;
}

export interface NetworkAgentNode {
  agentId: string;
}

export interface NetworkExternalNode {
  id: string;
  name: string;
  host: string;
}

export interface NetworkAgentEdge {
  outPort?: number;
  inPort?: number;
  method: ForwardMethod;
  channel?: string;
}

export interface NetworkFlow {
  nodes: Node<NetworkAgentNode | NetworkExternalNode>[];
  edges: Edge<NetworkAgentEdge>[];
}

export interface NetworkEdgeParsed {
  edgeId: string;
  sourceAgentId: string;
  sourceForward: {
    forwardId?: string;
    method: ForwardMethod;
    options?: ForwardOptions;
    agentPort: number;
    targetPort: number;
    target: string;
    targetType: ForwardTargetType;
  };
  targetAgentId?: string;
  nextEdge?: NetworkEdgeParsed;
  prevEdge?: NetworkEdgeParsed;
}

export interface NetworkEdgeLinked {
  firstEdge: NetworkEdgeParsed;
  lastEdge: NetworkEdgeParsed;
  length: number;
}

export interface ProxyProtocol {
  enabled: boolean;
  version: "1" | "2";
  send?: boolean;
  receive?: boolean;
}
export interface ForwardOptions {
  channel?: string; // gost channel
  listen?: string; // gost listen protocol
  forward?: string; // gost forward protocol
  proxyProtocol?: ProxyProtocol;
}
