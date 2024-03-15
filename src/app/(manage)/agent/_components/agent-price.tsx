import { api } from "~/trpc/server";
import { MoneyInput } from "~/lib/ui/money-input";
import { type ByteUnit, ByteUnitsShort } from "~/lib/utils";

export default async function AgentPrice({ agentId }: { agentId: string }) {
  const agentPrice = await api.system.getConfig.query({
    relationId: agentId,
    key: "TRAFFIC_PRICE",
  });
  const globalPrice = await api.system.getConfig.query({
    key: "TRAFFIC_PRICE",
  });

  const priceConfig = agentPrice.TRAFFIC_PRICE ?? globalPrice.TRAFFIC_PRICE;
  if (!priceConfig) {
    return null;
  }

  return (
    <div className="flex w-full items-end gap-1">
      <MoneyInput value={priceConfig.price} displayType="text" />
      <span className="text-lg">/</span>
      <span className="text-lg">
        {ByteUnitsShort[priceConfig.unit as ByteUnit]}
      </span>
    </div>
  );
}
