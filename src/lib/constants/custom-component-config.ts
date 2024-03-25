"use client";
import type { ConfigSchema } from "~/lib/types";
import dynamic from "next/dynamic";
import { TrafficPriceSkeleton } from "~/app/[local]/(manage)/admin/config/_components/traffic-price-config";

const TrafficPriceConfig = dynamic(
  () =>
    import(
      "~/app/[local]/(manage)/admin/config/_components/traffic-price-config"
    ),
  {
    ssr: false,
    loading: TrafficPriceSkeleton,
  },
);

export const trafficPriceConfigFieldSchema: ConfigSchema = {
  title: "流量价格",
  description: "流量价格，用于计算用户的流量费用。优先使用服务器节点上的配置。",
  component: "custom",
  type: "json",
  customComponent: TrafficPriceConfig,
};
