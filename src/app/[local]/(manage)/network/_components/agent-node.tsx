"use client";
import {
  Handle,
  type NodeProps,
  NodeToolbar,
  Position,
  useReactFlow,
} from "reactflow";
import { Button } from "~/lib/ui/button";
import { PlugIcon, Trash2Icon } from "lucide-react";
import { ServerIcon } from "~/lib/icons";
import { type NetworkAgentNode } from "~/lib/types/agent";
import { useStore } from "zustand";
import { useContext } from "react";
import { NetworkContext } from "~/app/[local]/(manage)/network/store/network-store";

export default function AgentNode(props: NodeProps<NetworkAgentNode>) {
  const { data } = props;
  const { agentId } = data;
  const { findAgent } = useStore(useContext(NetworkContext)!);
  const agent = findAgent(agentId);
  const { deleteElements } = useReactFlow();

  return (
    <div className="group flex h-40 w-40 flex-col items-center rounded text-sm hover:bg-accent">
      <NodeToolbar>
        <Button
          variant="ghost"
          className="h-auto p-1"
          onClick={() =>
            deleteElements({ nodes: [{ id: agentId }], edges: [] })
          }
        >
          <Trash2Icon className="h-4 w-4" />
        </Button>
      </NodeToolbar>
      <div className="relative">
        <ServerIcon className="h-40 w-40 fill-purple-600" />
        <p className="absolute left-[16px] top-[18px] text-xs">{agent?.name}</p>
        <Handle
          className="flow-agent-handle opacity-0 group-hover:opacity-100"
          position={Position.Right}
          type="source"
          style={{ right: "-14px" }}
          isValidConnection={(connection) =>
            connection.target !== connection.source
          }
        >
          <PlugIcon className="pointer-events-none h-5 w-5 -rotate-90" />
        </Handle>
        <Handle
          className="flow-agent-handle opacity-0 group-hover:opacity-100"
          type="target"
          position={Position.Left}
          style={{ left: "-14px" }}
          isValidConnection={(connection) =>
            connection.target !== connection.source
          }
        >
          <PlugIcon className="pointer-events-none h-5 w-5 -rotate-90" />
        </Handle>
      </div>
    </div>
  );
}
