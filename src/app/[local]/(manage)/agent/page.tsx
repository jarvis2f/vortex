import AgentResizableLayout from "~/app/[local]/(manage)/agent/_components/agent-resizable-layout";
import { api } from "~/trpc/server";
import { redirect, RedirectType } from "next/navigation";
import { AgentStatus } from "@prisma/client";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "global_menu" });

  return {
    title: `${t("agent")} - vortex`,
  };
}

export default async function AgentPage() {
  const agents = await api.agent.getAll.query(undefined);
  if (Object.values(agents).flat().length > 0) {
    let agent;
    if (agents.ONLINE.length > 0) {
      agent = agents.ONLINE[0];
    } else if (agents.OFFLINE.length > 0) {
      agent = agents.OFFLINE[0];
    } else if (agents.UNKNOWN.length > 0) {
      agent = agents.UNKNOWN[0];
    }
    if (agent) {
      redirect(
        `/agent/${agent.id}/${
          agent.status === AgentStatus.UNKNOWN ? "install" : "status"
        }`,
        RedirectType.replace,
      );
    }
  }
  return (
    <AgentResizableLayout agents={agents} agentId={""}>
      <div className="h-full w-full flex-1">
        <div className="flex h-full flex-1 flex-col items-center justify-center">
          <video autoPlay muted loop className="w-[60%]">
            <source src="/lllustration.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <h2 className="mt-4 text-xl text-gray-500">
            No agents found. Please install the agent on a device to get
            started.
          </h2>
        </div>
      </div>
    </AgentResizableLayout>
  );
}
