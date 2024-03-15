import {
  type AgentTaskResult,
  type NetworkEdgeLinked,
  type NetworkEdgeParsed,
  type NetworkExternalNode,
  type NetworkFlow,
} from "~/lib/types/agent";
import type { Node } from "reactflow";
import { ForwardMethod, ForwardTargetType, type User } from ".prisma/client";
import {
  createForward,
  deleteForward,
  getForwardMust,
} from "~/server/core/forward";
import globalLogger from "~/server/logger";
import { db } from "~/server/db";
import { TRPCError } from "@trpc/server";
import { isValidHost, isValidPort } from "~/lib/utils";
import { getUserMust, validateDataPermission } from "~/server/core/user";
import { getAgentMust } from "~/server/core/agent";
import { AgentStatus } from "@prisma/client";
import { getConfig } from "~/server/core/config";

const logger = globalLogger.child({ module: "network" });

export function parseNetworkEdge(flow: NetworkFlow): NetworkEdgeLinked {
  logger.debug(`开始解析网络拓扑: ${JSON.stringify(flow)}`);
  const { nodes, edges } = flow;
  const nodeMap = new Map<string, Node>(nodes.map((node) => [node.id, node]));

  let firstEdge: NetworkEdgeParsed | undefined = undefined,
    lastEdge: NetworkEdgeParsed | undefined = undefined,
    prevEdge: NetworkEdgeParsed | undefined = undefined;

  for (let i = edges.length - 1; i >= 0; i--) {
    const edge = edges[i]!;
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    const edgeData = edge.data;

    if (!sourceNode || !targetNode || !edgeData) {
      throw new Error("Invalid flow");
    }

    const isBetweenAgentForward = targetNode.type === "agent";
    let target: string;
    if (isBetweenAgentForward) {
      target = targetNode.id;
    } else {
      target = (targetNode.data as NetworkExternalNode).host;
    }

    const networkEdge: NetworkEdgeParsed = {
      edgeId: edge.id,
      sourceAgentId: sourceNode.id,
      sourceForward: {
        method: edgeData.method,
        options: {
          channel: edgeData.channel,
        },
        agentPort: edgeData.outPort ?? 0,
        targetPort: edgeData.inPort ?? 0,
        target: target,
        targetType: isBetweenAgentForward
          ? ForwardTargetType.AGENT
          : ForwardTargetType.EXTERNAL,
      },
      targetAgentId: isBetweenAgentForward ? targetNode.id : undefined,
      nextEdge: prevEdge,
    };

    if (i === 0) {
      firstEdge = networkEdge;
    }
    if (i === edges.length - 1) {
      lastEdge = networkEdge;
    }

    if (prevEdge) {
      prevEdge.prevEdge = networkEdge;
    }

    prevEdge = networkEdge;
  }

  if (!firstEdge || !lastEdge) {
    throw new Error("Invalid flow");
  }

  let edge: NetworkEdgeParsed | undefined = firstEdge;
  while (edge) {
    let listen = "tcp",
      forward = "tcp",
      channel = edge.sourceForward.options?.channel;
    prevEdge = edge.prevEdge;
    // 处理listen
    if (edge.sourceForward.method === ForwardMethod.GOST) {
      if (edge.sourceForward.options?.channel) {
        forward = "relay+" + edge.sourceForward.options?.channel;
      }
    }
    if (prevEdge) {
      if (prevEdge.sourceForward.method === ForwardMethod.GOST) {
        if (prevEdge.sourceForward.options?.channel) {
          listen = "relay+" + prevEdge.sourceForward.options?.channel;
          channel = prevEdge.sourceForward.options?.channel;
        }
      }
    }
    edge.sourceForward.options = {
      channel: channel,
      listen: listen,
      forward: forward,
    };
    edge = edge.nextEdge;
  }

  return {
    firstEdge: firstEdge,
    lastEdge: lastEdge,
    length: edges.length,
  };
}

export async function validateNetworkEdge(
  edgeLinked: NetworkEdgeLinked,
  userId: string,
) {
  let e = edgeLinked.lastEdge;
  if (e.sourceForward.targetType !== ForwardTargetType.EXTERNAL) {
    throw new Error("Invalid flow, last edge target type must be external");
  }
  if (!isValidHost(e.sourceForward.target)) {
    throw new Error("Invalid flow, external host");
  }
  if (!isValidPort(e.sourceForward.targetPort)) {
    throw new Error("Invalid flow, external port");
  }
  const user = await getUserMust(userId);
  if (e.prevEdge) {
    e = e.prevEdge;
    while (e) {
      if (e.sourceForward.targetType !== ForwardTargetType.AGENT) {
        throw new Error("Invalid flow, agent must be between");
      }
      await validateNetworkAgent(
        e.targetAgentId!,
        user,
        e.sourceForward.targetPort,
      );
      if (!e.prevEdge) {
        break;
      }
      e = e.prevEdge;
    }
  }
  await validateNetworkAgent(e.sourceAgentId, user, e.sourceForward.agentPort);
}

export async function validateNetworkAgent(
  agentId: string,
  user: User,
  port: number,
) {
  const agent = await getAgentMust(agentId);
  validateDataPermission(
    { user: { id: user.id, roles: user.roles } },
    agent,
    "data:agent",
    () => agent.isShared,
  );
  if (agent.status !== AgentStatus.ONLINE) {
    throw new Error(`Invalid flow, agent ${agentId} is not online`);
  }
  if (port != 0) {
    const agentPortRange = await getConfig({
      key: "AGENT_PORT_RANGE",
      relationId: agent.id,
    });
    if (agentPortRange && agentPortRange != "") {
      const [min, max] = (agentPortRange as string).split("-");
      if (port < parseInt(min!) || port > parseInt(max!)) {
        throw new Error(
          `Invalid flow, agent port ${port} is out of range ${agentPortRange}`,
        );
      }
    }
  }
}

export async function createNetwork({
  flow,
  networkId,
  userId,
}: {
  flow: NetworkFlow;
  networkId: string;
  userId: string;
}): Promise<NetworkEdgeLinked> {
  const networkEdgeLinked = parseNetworkEdge(flow);
  await validateNetworkEdge(networkEdgeLinked, userId);
  let edge: NetworkEdgeParsed | undefined = networkEdgeLinked.lastEdge;
  while (edge) {
    const sourceForward = edge.sourceForward;
    logger.info(
      `开始创建转发 ${sourceForward.method} ${edge.sourceAgentId} ${sourceForward.agentPort} -> ${sourceForward.target} ${sourceForward.targetPort}`,
    );
    edge.sourceForward.forwardId = (
      await createForward({
        params: {
          method: sourceForward.method,
          options: sourceForward.options,
          agentPort: sourceForward.agentPort,
          targetPort: sourceForward.targetPort,
          target: sourceForward.target,
          targetType: sourceForward.targetType,
          agentId: edge.sourceAgentId,
        },
        userId: userId,
      })
    ).forward.id;

    const f = await getForwardMust(edge.sourceForward.forwardId);
    logger.info(
      `转发创建成功 ${f.agentId} ${f.agentPort} -> ${f.target} ${f.targetPort}`,
    );
    edge.sourceForward.agentPort = f.agentPort;
    edge.sourceForward.targetPort = f.targetPort;

    edge = edge.prevEdge;
    if (edge?.sourceForward.targetPort === 0) {
      edge.sourceForward.targetPort = f.agentPort;
    }
  }
  await updateFlow({
    flow,
    linked: networkEdgeLinked,
    networkId,
  });

  return networkEdgeLinked;
}

export async function updateFlow({
  flow,
  linked,
  networkId,
}: {
  flow: NetworkFlow;
  linked: NetworkEdgeLinked;
  networkId: string;
}) {
  let edge: NetworkEdgeParsed | undefined = linked.lastEdge;
  while (edge) {
    const sourceForward = edge.sourceForward;
    const edgeData = flow.edges.find((e) => e.id === edge?.edgeId)!.data!;
    edgeData.outPort = sourceForward.agentPort;
    edgeData.inPort = sourceForward.targetPort;
    edge = edge.prevEdge;
  }
  await db.network.update({
    where: {
      id: networkId,
    },
    data: {
      flow: flow as any,
    },
  });
}

export async function deleteNetwork(id: string) {
  const network = await getNetworkMust(id);
  const edges = await db.networkEdge.findMany({
    where: {
      networkId: id,
    },
  });
  if (edges && edges.length > 0) {
    const results = await Promise.all(
      edges.map(async (edge) => {
        if (edge.sourceForwardId) {
          return await deleteForward(edge.sourceForwardId);
        }
      }),
    );
    const error = results
      .filter((result) => result?.result.success === false)
      .map(
        (result) =>
          `${result?.forward.id} ${(result?.result as AgentTaskResult).extra}`,
      )
      .join("\n");
    if (error.length > 0) {
      throw new TRPCError({
        message: `删除转发失败 \n${error}`,
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  await db.networkEdge.updateMany({
    where: {
      networkId: id,
    },
    data: {
      deleted: true,
    },
  });

  await db.network.update({
    where: {
      id,
    },
    data: {
      deleted: true,
    },
  });

  return network;
}

export async function getNetworkMust(id: string) {
  const network = await db.network.findUnique({
    where: { id: id, deleted: false },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      edges: {
        include: {
          sourceForward: {
            select: {
              id: true,
              agentPort: true,
              target: true,
              targetPort: true,
              status: true,
              agent: {
                select: {
                  id: true,
                  name: true,
                  info: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!network) {
    throw new TRPCError({
      message: `Network ${id} not found`,
      code: "NOT_FOUND",
    });
  }
  return network;
}
