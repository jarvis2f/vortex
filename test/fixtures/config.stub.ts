import { Config } from "@prisma/client";

export const configStub = {
  trafficPrice: Object.freeze<Config>({
    id: "traffic_price-id",
    key: "TRAFFIC_PRICE",
    value: JSON.stringify({
      price: "0.01",
      unit: "Kilobytes",
    }),
    relationId: "0",
  }),
};
