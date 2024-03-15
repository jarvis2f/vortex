import { AgentStatus } from "@prisma/client";
import { Agent } from ".prisma/client";
import { userStub } from "./user.stub";

export const agentStub = {
  agent: Object.freeze<Agent>({
    id: "agent-id",
    name: "agent-name",
    description: "agent-description",
    connectConfig: {
      serverPrivateKey:
        "9cd8309e7f4d7a8c54d02a43553bc0ffd7307be017ca1228284d8fe2360baa1d",
      serverPublicKey:
        "04aaf23e3f46764bce7bfbb7c69273c12701cf1ece637f6a95219d1740dc25e84349272bf0fd7409a72181b8362e4e16f7821e8f8a46ee17fa837d9dbc977a70b7",
      secret:
        "4035f742b37d4588f9c81ffa3a0396ea2e53dbe223b333ee3778d7172168d721",
    },
    info: {
      ip: {
        ipv4: "0.0.0.1",
      },
    },
    status: AgentStatus.ONLINE,
    isShared: true,
    createdById: userStub.user.id,
    lastReport: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deleted: false,
  }),
  agent2: Object.freeze<Agent>({
    id: "agent-id2",
    name: "agent-name2",
    description: "agent-description2",
    connectConfig: {
      serverPrivateKey: "",
      serverPublicKey: "",
    },
    info: {
      ip: {
        ipv4: "0.0.0.2",
      },
    },
    status: AgentStatus.ONLINE,
    isShared: true,
    createdById: userStub.user.id,
    lastReport: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deleted: false,
  }),
};
