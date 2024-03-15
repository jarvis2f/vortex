import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "reactflow";
import { create } from "zustand";
import {
  type AgentGetAllOutputItem,
  type NetworkGetOneOutput,
} from "~/lib/types/trpc";
import { createContext } from "react";
import { type JsonObject } from "@prisma/client/runtime/library";
import { type NetworkAgentEdge } from "~/lib/types/agent";

export type AgentProps = {
  inFlow?: boolean;
} & AgentGetAllOutputItem;

interface NetworkProps {
  network?: NetworkGetOneOutput;
  agents: {
    UNKNOWN: AgentProps[];
    ONLINE: AgentProps[];
    OFFLINE: AgentProps[];
  };
  nodes: Node[];
  edges: Edge[];

  externalNodeNewOpen?: boolean;
}

interface NetworkState extends NetworkProps {
  onNetworkChange: (network: NetworkGetOneOutput) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onEdgeDataChange: (id: string, data: Partial<NetworkAgentEdge>) => void;
  onConnect: OnConnect;
  onExternalNodeNewOpen: (open: boolean) => void;
  findAgent: (id: string) => AgentProps | undefined;
  findEdge: (id: string) => Edge | undefined;
  findNode: (id: string) => Node | undefined;
  checkIsForward2Agent: (id: string) => boolean;
}

type NetworkStore = ReturnType<typeof createNetworkStore>;

export const createNetworkStore = (initialState?: Partial<NetworkProps>) => {
  const defaultState: NetworkProps = {
    agents: {
      UNKNOWN: [],
      ONLINE: [],
      OFFLINE: [],
    },
    nodes: [],
    edges: [],
  };
  return create<NetworkState>()((set, get) => ({
    ...defaultState,
    ...initialState,
    onNetworkChange: (network: NetworkGetOneOutput) => {
      const flow = network.flow;
      const nodes = ((flow as JsonObject).nodes as unknown as Node[]) || [];
      const agents = get().agents;
      Object.values(agents).forEach((agents) => {
        agents.forEach((agent) => {
          agent.inFlow = false;
        });
      });
      nodes.forEach((node) => {
        Object.values(agents).forEach((agents) => {
          agents.forEach((agent) => {
            if (agent.id === node.id) {
              agent.inFlow = true;
            }
          });
        });
      });
      set({
        network,
        agents,
        nodes: nodes,
        edges: ((flow as JsonObject).edges as unknown as Edge[]) || [],
      });
    },
    onNodesChange: (changes: NodeChange[]) => {
      changes.forEach((change) => {
        const agents = get().agents;
        if (change.type === "add") {
          Object.values(get().agents).forEach((agents) => {
            agents.forEach((agent) => {
              if (agent.id === change.item.id) {
                agent.inFlow = true;
              }
            });
          });
        } else if (change.type === "remove") {
          Object.values(get().agents).forEach((agents) => {
            agents.forEach((agent) => {
              if (agent.id === change.id) {
                agent.inFlow = false;
              }
            });
          });
        }
        set({
          agents,
        });
      });
      set({
        nodes: applyNodeChanges(changes, get().nodes),
      });
    },
    onEdgesChange: (changes: EdgeChange[]) => {
      set({
        edges: applyEdgeChanges(changes, get().edges),
      });
    },
    onEdgeDataChange: (id: string, data: Partial<NetworkAgentEdge>) => {
      const edges = get().edges;
      set({
        edges: edges.map((edge) => {
          if (edge.id === id) {
            return {
              ...edge,
              data: {
                ...edge.data,
                ...data,
              },
            };
          }
          return edge;
        }),
      });
    },
    onConnect: (connection: Connection) => {
      set({
        edges: addEdge(connection, get().edges),
      });
    },
    onExternalNodeNewOpen: (open: boolean) => {
      set({
        externalNodeNewOpen: open,
      });
    },
    findAgent: (id: string) => {
      const agents = get().agents;
      const agent = Object.values(agents).find((agents) =>
        agents.find((agent) => agent.id === id),
      );
      return agent?.find((agent) => agent.id === id);
    },
    findEdge: (id: string) => {
      const edges = get().edges;
      return edges.find((edge) => edge.id === id);
    },
    findNode: (id: string) => {
      const nodes = get().nodes;
      return nodes.find((node) => node.id === id);
    },
    checkIsForward2Agent: (edgeId: string) => {
      const edge = get().findEdge(edgeId);
      if (!edge) {
        return false;
      }
      const node = get().findNode(edge.target);
      if (!node) {
        return false;
      }
      return node.type === "agent";
    },
  }));
};

export const NetworkContext = createContext<NetworkStore | null>(null);
