import { api } from "~/trpc/server";
import NetworkFlow from "~/app/[local]/(manage)/network/_components/network-flow";

export const metadata = {
  title: "组网 - vortex",
};

export default async function NetworkPage({
  params: { networkId },
}: {
  params: {
    networkId: string;
  };
}) {
  const network =
    networkId === "new"
      ? undefined
      : await api.network.getOne.query({ id: networkId });
  const agents = await api.agent.getAll.query();
  return <NetworkFlow network={network} agents={agents} />;
}
