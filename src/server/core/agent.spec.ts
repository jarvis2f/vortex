import { handleInstall, handleTraffic } from "./agent";
import { dbMock, redisMock } from "../../../test/jest.setup";
import { agentStub } from "../../../test/fixtures/agent.stub";
import { forwardStub } from "../../../test/fixtures/forward.stub";
import { agentTaskStub } from "../../../test/fixtures/agent-task.stub";

jest.mock("~/server/core/agent-task", () => ({
  distributeTask: jest
    .fn()
    .mockImplementation(async () => agentTaskStub.helloTask.id),
  getTaskResult: jest
    .fn()
    .mockImplementation(async () => agentTaskStub.helloTask.result),
}));

describe("agent", () => {
  describe("handleInstall", () => {
    beforeEach(() => {
      process.env.REDIS_URL = "redis://localhost:6379";
    });

    it("should handle install correctly", async () => {
      dbMock.agent.findUnique.mockResolvedValue(agentStub.agent);
      const result = await handleInstall(
        agentStub.agent.id,
        "04980072d728c44106e35dfa5bb539fe11e77e0fa6beffcaf2808d3c4a16601fc9cb90525ac27ef70bb6e204b8eda53b524afa2bb80532dd3df3bc5b382380ee42",
        "4035f742b37d4588f9c81ffa3a0396ea2e53dbe223b333ee3778d7172168d721",
      );
      expect(redisMock.call).toHaveBeenCalledTimes(1);
      expect(dbMock.agent.update).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        link: expect.any(String),
      });
    });
  });

  describe("handleTraffic", () => {
    const mockIptablesTrafficOut = `
    2018      100 ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:1080 /* UPLOAD 1080->0.0.0.0 */
       0        0 ACCEPT     udp  --  *      *       0.0.0.0/0            0.0.0.0/0            udp dpt:1080 /* UPLOAD-UDP 1080->0.0.0.0 */
    2134      100 ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp spt:1080 /* DOWNLOAD 1080->0.0.0.0 */
       0        0 ACCEPT     udp  --  *      *       0.0.0.0/0            0.0.0.0/0            udp spt:1080 /* DOWNLOAD-UDP 1080->0.0.0.0 */
  `;
    const mockTraffic = {
      time: 1705454535160.853,
      traffic: btoa(mockIptablesTrafficOut),
    };
    it("should handle traffic correctly", async () => {
      redisMock.keys.mockResolvedValue([`agent_traffic:${agentStub.agent.id}`]);
      redisMock.rpop.mockResolvedValue([JSON.stringify(mockTraffic)]);
      dbMock.agent.findUnique.mockResolvedValue(agentStub.agent);
      redisMock.llen.mockResolvedValue(1);
      dbMock.forward.findMany.mockResolvedValue([forwardStub.forward]);
      dbMock.forward.findUnique.mockResolvedValue(forwardStub.forward);

      await handleTraffic();

      expect(dbMock.forwardTraffic.createMany).toHaveBeenCalledWith({
        data: [
          {
            forwardId: forwardStub.forward.id,
            time: new Date(mockTraffic.time),
            download: 100,
            upload: 100,
          },
        ],
      });

      expect(dbMock.forward.update).toHaveBeenCalledWith({
        where: {
          id: forwardStub.forward.id,
        },
        data: {
          download: 100,
          upload: 100,
          usedTraffic: 200,
        },
      });
    });
  });
});
