import Gost, { GostConfig } from "./gost";
import { dbMock } from "../../../test/jest.setup";
import { forwardStub } from "../../../test/fixtures/forward.stub";
import { agentStub } from "../../../test/fixtures/agent.stub";

describe("gost", () => {
  const gostConfig1: GostConfig = {
    services: [
      {
        name: `forward-${forwardStub.forward2agent.id}`,
        addr: `:${forwardStub.forward2agent.agentPort}`,
        handler: {
          type: "relay",
          chain: `chain-${forwardStub.forward2agent.id}`,
        },
        listener: {
          type: "ws",
        },
        metadata: {
          enableStats: true,
        },
        observer: "agent-observer",
      },
    ],
    chains: [
      {
        name: `chain-${forwardStub.forward2agent.id}`,
        hops: [
          {
            name: `hop-${forwardStub.forward2agent.id}`,
            nodes: [
              {
                name: `node-${forwardStub.forward2agent.id}`,
                addr: `${agentStub.agent2.id}:${forwardStub.forward2agent.targetPort}`,
                connector: {
                  type: "relay",
                },
                dialer: {
                  type: "ws",
                  tls: {
                    serverName: agentStub.agent2.id,
                  },
                },
              },
            ],
          },
        ],
      },
    ],
  };

  const gostConfig2: GostConfig = {
    services: [
      {
        name: `forward-${forwardStub.forward2External.id}`,
        addr: `:${forwardStub.forward2External.agentPort}`,
        handler: {
          type: "tcp",
        },
        listener: {
          type: "tcp",
        },
        metadata: {
          enableStats: true,
        },
        observer: "agent-observer",
        forwarder: {
          nodes: [
            {
              name: `node-${forwardStub.forward2External.id}`,
              addr: `${forwardStub.forward2External.target}:${forwardStub.forward2External.targetPort}`,
              connector: {
                type: "tcp",
              },
            },
          ],
        },
      },
    ],
  };

  it("should add forward 2 agent correctly", async () => {
    dbMock.config.findUnique.mockResolvedValue(null);
    dbMock.agent.findUnique.mockResolvedValue(agentStub.agent2);
    const gost = await Gost(agentStub.agent.id);
    await gost.addForward(forwardStub.forward2agent);

    expect(gost.config).toStrictEqual(gostConfig1);
    expect(dbMock.config.upsert).toHaveBeenCalledTimes(1);
  });

  it("should add forward 2 external correctly", async () => {
    dbMock.config.findUnique.mockResolvedValue(null);
    const gost = await Gost(agentStub.agent.id);
    await gost.addForward(forwardStub.forward2External);

    expect(gost.config).toStrictEqual(gostConfig2);
    expect(dbMock.config.upsert).toHaveBeenCalledTimes(1);
  });

  it("should add forward 2 none options external correctly", async () => {
    dbMock.config.findUnique.mockResolvedValue(null);
    const gost = await Gost(agentStub.agent.id);
    await gost.addForward(forwardStub.forward2ExternalNoneOption);

    expect(gost.config).toStrictEqual({
      services: [
        {
          ...gostConfig2.services![0],
          handler: {
            type: "relay",
          },
        },
      ],
    });
    expect(dbMock.config.upsert).toHaveBeenCalledTimes(1);
  });

  it("should remove forward correctly", async () => {
    dbMock.config.findUnique.mockResolvedValue({
      id: "config-id",
      relationId: agentStub.agent.id,
      key: "AGENT_GOST_CONFIG",
      value: JSON.stringify(gostConfig1),
    });

    const gost = await Gost(agentStub.agent.id);
    await gost.removeForward(forwardStub.forward2agent);

    expect(gost.config).toStrictEqual({
      services: [],
      chains: [],
    });
    expect(dbMock.config.upsert).toHaveBeenCalledTimes(1);
  });
});
