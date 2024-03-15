import { AgentTask, AgentTaskStatus, ForwardStatus } from ".prisma/client";
import { agentStub } from "../../../test/fixtures/agent.stub";
import { forwardStub } from "../../../test/fixtures/forward.stub";
import { dbMock } from "../../../test/jest.setup";
import type { AgentTaskResult } from "../../lib/types/agent";
import { handleForwardTaskResult, handlePreTaskResult } from "./agent-task";

describe("agent-task", () => {
  describe("handlePreTaskResult", () => {
    const mockAgentTask: AgentTask = {
      id: "task-id",
      agentId: agentStub.agent.id,
      type: "FORWARD",
      task: {
        action: "add",
        forwardId: forwardStub.forward.id,
      },
      result: null,
      status: AgentTaskStatus.CREATED,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should handle pre task result correctly", async () => {
      dbMock.agent.findUnique.mockResolvedValue(agentStub.agent);
      dbMock.agentTask.findUnique.mockResolvedValue(mockAgentTask);
      dbMock.agentTask.update.mockResolvedValue(mockAgentTask);
      const channel = `agent_task_result_${agentStub.agent.id}`;
      const mockAgentTaskResult: AgentTaskResult = {
        id: "task-id",
        success: true,
        extra: "extra",
      };
      await handlePreTaskResult({
        channel,
        message: JSON.stringify(mockAgentTaskResult),
      });
      expect(dbMock.agentTask.update).toHaveBeenCalledTimes(1);
    });

    it("should handle pre failed task result correctly", async () => {
      dbMock.agent.findUnique.mockResolvedValue(agentStub.agent);
      dbMock.agentTask.findUnique.mockResolvedValue(mockAgentTask);
      dbMock.agentTask.update.mockResolvedValue(mockAgentTask);
      const channel = `agent_task_result_${agentStub.agent.id}`;
      const mockAgentTaskResult = '{"id":"taskId","success":false,"extra":""}';
      await handlePreTaskResult({
        channel,
        message: mockAgentTaskResult,
      });
      expect(dbMock.agentTask.update).toHaveBeenCalledTimes(1);
    });
  });

  describe("handleTaskResult", () => {
    it("should handle succeeded forward task result correctly", async () => {
      dbMock.forward.findUnique.mockResolvedValue(forwardStub.forward);
      dbMock.forward.update.mockResolvedValue(forwardStub.forward);
      const mockExtra = {
        agentPort: 80,
      };
      const mockAgentTask: AgentTask = {
        id: "task-id",
        agentId: agentStub.agent.id,
        type: "FORWARD",
        task: {
          action: "add",
          forwardId: forwardStub.forward.id,
        },
        result: {
          id: "task-id",
          success: true,
          extra: btoa(JSON.stringify(mockExtra)),
        },
        status: AgentTaskStatus.SUCCEEDED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await handleForwardTaskResult({ task: mockAgentTask });

      expect(dbMock.forward.update).toHaveBeenCalledTimes(1);
      expect(dbMock.forward.update).toHaveBeenCalledWith({
        where: {
          id: forwardStub.forward.id,
        },
        data: {
          status: ForwardStatus.RUNNING,
          agentPort: mockExtra.agentPort,
        },
      });
    });

    it("should handle failed forward task result correctly", async () => {
      dbMock.forward.findUnique.mockResolvedValue(forwardStub.forward);
      dbMock.forward.update.mockResolvedValue(forwardStub.forward);
      const mockAgentTask: AgentTask = {
        id: "task-id",
        agentId: agentStub.agent.id,
        type: "FORWARD",
        task: {
          action: "add",
          forwardId: forwardStub.forward.id,
        },
        result: {
          id: "task-id",
          success: false,
          extra: "error",
        },
        status: AgentTaskStatus.FAILED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await handleForwardTaskResult({ task: mockAgentTask });

      expect(dbMock.forward.update).toHaveBeenCalledTimes(1);
      expect(dbMock.forward.update).toHaveBeenCalledWith({
        where: {
          id: forwardStub.forward.id,
        },
        data: {
          status: ForwardStatus.CREATED_FAILED,
        },
      });
    });
  });
});
