import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
} from "reactflow";
import AgentEdgeToolbar from "~/app/[local]/(manage)/network/_components/agent-edge-toolbar";
import { type NetworkAgentEdge } from "~/lib/types/agent";
import { MoveRightIcon, XIcon } from "lucide-react";
import { useStore } from "zustand";
import { useContext, useMemo } from "react";
import { NetworkContext } from "~/app/[local]/(manage)/network/store/network-store";

export default function AgentEdge({
  id,
  data,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {
    stroke: "#fef08a",
    strokeWidth: 2,
  },
  markerEnd,
}: EdgeProps<NetworkAgentEdge>) {
  const { network, findEdge } = useStore(useContext(NetworkContext)!);
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isForward = useMemo(() => {
    if (!network) return false;
    const flowEdge = findEdge(id);
    return (
      network.edges?.find(
        (edge) => edge.sourceForward?.agent.id === flowEdge?.source,
      ) !== undefined
    );
  }, [network]);

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -110%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan opacity-0 transition-opacity duration-200 hover:opacity-100"
        >
          <AgentEdgeToolbar id={id} data={data} />
        </div>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -60%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          {!isForward && (
            <XIcon className="inline-block h-4 w-4 text-red-500" />
          )}
        </div>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, 8px) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
        >
          <p className="flex items-center gap-2 text-xs">
            <span className="rounded bg-fuchsia-400 px-1">
              {data?.outPort ?? "随机"}
            </span>
            <MoveRightIcon className="h-4 w-4" />
            <span className="rounded border px-1">
              {data?.method} {data?.channel}
            </span>
            <MoveRightIcon className="h-4 w-4" />
            <span className="rounded bg-pink-400 px-1">
              {data?.inPort ?? "随机"}
            </span>
          </p>
        </div>
      </EdgeLabelRenderer>
      {isForward && (
        <circle
          style={{ filter: `drop-shadow(3px 3px 5px #ccfbf1` }}
          r="4"
          fill="#99f6e4"
          className="circle"
        >
          <animateMotion dur="6s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
    </>
  );
}
