import { ForwardTraffic } from "@prisma/client";
import { forwardStub } from "./forward.stub";

export const forwardTrafficStub = {
  kb: Object.freeze<ForwardTraffic>({
    id: 1,
    forwardId: forwardStub.forward.id,
    time: new Date("2024-01-01T00:00:00Z"),
    upload: 1024,
    download: 1024,
  }),
};
