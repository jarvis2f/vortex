import { AgentTask } from ".prisma/client";
import { agentStub } from "./agent.stub";

export const agentTaskStub = {
  helloTask: Object.freeze<AgentTask>({
    id: "hello-task-id",
    agentId: agentStub.agent.id,
    type: "hello",
    task: {
      id: "hello-task-id",
      type: "hello",
    },
    result: {
      id: "hello-task-id",
      success: true,
    },
    status: "SUCCEEDED",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
};
