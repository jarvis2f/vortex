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
import { type NetworkExternalNode } from "~/lib/types/agent";

export default function ExternalNode(props: NodeProps<NetworkExternalNode>) {
  const { data } = props;
  const { id, name, host } = data;
  const { deleteElements } = useReactFlow();

  return (
    <div className="group flex h-40 w-40 flex-col items-center rounded text-sm hover:bg-accent">
      <NodeToolbar>
        <Button
          variant="ghost"
          className="h-auto p-1"
          onClick={() => deleteElements({ nodes: [{ id }], edges: [] })}
        >
          <Trash2Icon className="h-4 w-4" />
        </Button>
      </NodeToolbar>
      <div className="relative">
        <ServerIcon className="h-40 w-40 fill-green-600" />
        <p className="absolute left-[16px] top-[18px] text-xs">{name}</p>
        <p className="absolute left-[16px] top-[65px] text-xs">{host}</p>
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
