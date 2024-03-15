import { NetworkEdgeParsed, NetworkFlow } from "~/lib/types/agent";
import { createForward, getForwardMust } from "~/server/core/forward";
import { createNetwork } from "./network";
import { forwardStub } from "../../../test/fixtures/forward.stub";
import { agentStub } from "../../../test/fixtures/agent.stub";
import { dbMock } from "../../../test/jest.setup";
import { userStub } from "../../../test/fixtures/user.stub";

const external1Id = "external1Id";
const mockToExternalFlow: NetworkFlow = {
  nodes: [
    {
      id: agentStub.agent.id,
      type: "agent",
      position: { x: 0, y: 0 },
      data: { agentId: agentStub.agent.id },
    },
    {
      id: external1Id,
      type: "external",
      position: { x: 0, y: 0 },
      data: {
        id: external1Id,
        name: "externalName",
        host: "0.0.0.0",
      },
    },
  ],
  edges: [
    {
      id: "edge1",
      source: agentStub.agent.id,
      target: external1Id,
      data: {
        method: "IPTABLES",
        outPort: 1080,
        inPort: 1090,
      },
    },
  ],
};

const mockToAgentUseGostFlow: NetworkFlow = {
  nodes: [
    {
      id: agentStub.agent.id,
      type: "agent",
      position: { x: 0, y: 0 },
      data: { agentId: agentStub.agent.id },
    },
    {
      id: agentStub.agent2.id,
      type: "agent",
      position: { x: 0, y: 0 },
      data: { agentId: agentStub.agent2.id },
    },
    {
      id: external1Id,
      type: "external",
      position: { x: 0, y: 0 },
      data: {
        id: external1Id,
        name: "externalName",
        host: "0.0.0.0",
      },
    },
  ],
  edges: [
    {
      id: "edge1",
      source: agentStub.agent.id,
      target: agentStub.agent2.id,
      data: {
        method: "GOST",
        channel: "ws",
        outPort: undefined,
        inPort: undefined,
      },
    },
    {
      id: "edge2",
      source: agentStub.agent2.id,
      target: external1Id,
      data: {
        method: "GOST",
        inPort: 1090,
      },
    },
  ],
};

jest.mock("~/server/core/forward", () => ({
  createForward: jest.fn().mockImplementation(async () => ({
    forward: forwardStub.forward,
  })),
  getForwardMust: jest.fn().mockImplementation(async () => forwardStub.forward),
}));

describe("createNetwork", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create to external network correctly", async () => {
    const networkId = "mockNetworkId";
    dbMock.user.findUnique.mockResolvedValue(userStub.user);
    dbMock.agent.findUnique.mockResolvedValueOnce(agentStub.agent);
    const result = await createNetwork({
      flow: mockToExternalFlow,
      networkId,
      userId: userStub.user.id,
    });

    expect(createForward).toHaveBeenCalledTimes(
      mockToExternalFlow.edges.length,
    );
    expect(getForwardMust).toHaveBeenCalledTimes(
      mockToExternalFlow.edges.length,
    );

    const expectedResultEdge: NetworkEdgeParsed = {
      edgeId: "edge1",
      sourceAgentId: agentStub.agent.id,
      sourceForward: {
        forwardId: forwardStub.forward.id,
        method: "IPTABLES",
        options: {
          channel: undefined,
          listen: "tcp",
          forward: "tcp",
        },
        agentPort: 1080,
        targetPort: 1090,
        target: "0.0.0.0",
        targetType: "EXTERNAL",
      },
      nextEdge: undefined,
      targetAgentId: undefined,
    };

    expect(result).toStrictEqual({
      firstEdge: expectedResultEdge,
      lastEdge: expectedResultEdge,
      length: mockToExternalFlow.edges.length,
    });
  });

  it("should create to agent network correctly", async () => {
    const networkId = "mockNetworkId";
    dbMock.user.findUnique.mockResolvedValue(userStub.user);
    dbMock.agent.findUnique.mockResolvedValueOnce(agentStub.agent);
    dbMock.agent.findUnique.mockResolvedValueOnce(agentStub.agent2);
    const result = await createNetwork({
      flow: mockToAgentUseGostFlow,
      networkId,
      userId: userStub.user.id,
    });

    expect(createForward).toHaveBeenCalledTimes(
      mockToAgentUseGostFlow.edges.length,
    );
    expect(getForwardMust).toHaveBeenCalledTimes(
      mockToAgentUseGostFlow.edges.length,
    );

    expect(result).toMatchObject({
      firstEdge: {
        nextEdge: {
          sourceAgentId: agentStub.agent2.id,
        },
        sourceAgentId: agentStub.agent.id,
        targetAgentId: agentStub.agent2.id,
        sourceForward: {
          method: "GOST",
          options: {
            channel: "ws",
            listen: "tcp",
            forward: "relay+ws",
          },
          agentPort: 1080,
          targetPort: 1090,
          target: "agent-id2",
          targetType: "AGENT",
          forwardId: "forward-id",
        },
      },
      lastEdge: {
        sourceAgentId: agentStub.agent2.id,
        sourceForward: {
          method: "GOST",
          options: {
            listen: "relay+ws",
            forward: "tcp",
          },
          agentPort: 1080,
          targetPort: 1090,
          target: "0.0.0.0",
          targetType: "EXTERNAL",
          forwardId: "forward-id",
        },
      },
      length: mockToAgentUseGostFlow.edges.length,
    });

    expect(dbMock.network.update).toHaveBeenCalledWith({
      where: {
        id: networkId,
      },
      data: {
        flow: expect.any(Object),
      },
    });
  });

  it("should permission denied when user without permission", async () => {
    const userId = "mockUserId";
    const networkId = "mockNetworkId";
    dbMock.user.findUnique.mockResolvedValue({ ...userStub.user, id: userId });
    dbMock.agent.findUnique.mockResolvedValue({
      ...agentStub.agent,
      isShared: false,
    });
    await expect(async () => {
      await createNetwork({
        flow: mockToExternalFlow,
        networkId,
        userId: userId,
      });
    }).rejects.toThrow("Permission denied");
  });
});
