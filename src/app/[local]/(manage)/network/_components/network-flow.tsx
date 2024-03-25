"use client";
import ReactFlow, { Background, Controls, Panel } from "reactflow";
import { useEffect, useRef } from "react";
import AgentNode from "~/app/[local]/(manage)/network/_components/agent-node";
import {
  type AgentGetAllOutput,
  type NetworkGetOneOutput,
} from "~/lib/types/trpc";
import {
  createNetworkStore,
  NetworkContext,
} from "~/app/[local]/(manage)/network/store/network-store";
import AgentEdge from "~/app/[local]/(manage)/network/_components/agent-edge";
import ExternalNode from "~/app/[local]/(manage)/network/_components/external-node";
import { NetworkCommand } from "~/app/[local]/(manage)/network/_components/network-command";
import NetworkEdit from "~/app/[local]/(manage)/network/_components/network-edit";
import "reactflow/dist/style.css";
import ExternalNodeNew from "~/app/[local]/(manage)/network/_components/external-node-new";

interface NetworkFlowProps {
  agents: AgentGetAllOutput;
  network?: NetworkGetOneOutput;
}

const nodeTypes = { agent: AgentNode, external: ExternalNode };
const edgeTypes = { agent: AgentEdge };

export default function NetworkFlow({ agents, network }: NetworkFlowProps) {
  const store = useRef(createNetworkStore({ agents })).current;
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNetworkChange,
    onExternalNodeNewOpen,
  } = store();

  useEffect(() => {
    if (network) {
      onNetworkChange(network);
    }
  }, [network]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "i" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onExternalNodeNewOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <NetworkContext.Provider value={store}>
      <div className="h-screen">
        <ReactFlow
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          defaultEdgeOptions={{
            type: "agent",
          }}
          connectionLineStyle={{
            stroke: "#fef08a",
            strokeWidth: 2,
          }}
          fitView
          onError={(error) => console.error(error)}
        >
          <div className="flex p-4">
            <Panel
              position="top-left"
              className="flex flex-1 items-center gap-4"
            >
              <h1 className="text-3xl">Network</h1>
              <h2 className="text-xl">{network?.name ?? "新的组网"}</h2>
            </Panel>
            {!network && (
              <Panel position="top-right" className="flex items-center gap-4">
                <NetworkCommand />
                <NetworkEdit />
              </Panel>
            )}
          </div>
          <Background lineWidth={20} />
          <Controls />
          <ExternalNodeNew />
        </ReactFlow>
      </div>
    </NetworkContext.Provider>
  );
}
