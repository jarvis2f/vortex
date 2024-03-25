"use client";
import { type NetworkAgentEdge } from "~/lib/types/agent";
import AgentEdgeTest from "~/app/[local]/(manage)/network/_components/agent-edge-test";
import AgentEdgeForwardSettings from "~/app/[local]/(manage)/network/_components/agent-edge-forward-settings";

export default function AgentEdgeToolbar({
  id,
  data,
}: {
  id: string;
  data?: NetworkAgentEdge;
}) {
  return (
    <div className="flex gap-1">
      <AgentEdgeForwardSettings edgeId={id} data={data} />
      <AgentEdgeTest edgeId={id} />
    </div>
  );
}
