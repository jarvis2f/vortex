import { CableIcon, Server } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "~/lib/ui/command";
import { useContext, useEffect, useState } from "react";
import { Button } from "~/lib/ui/button";
import { useStore } from "zustand";
import {
  type AgentProps,
  NetworkContext,
} from "~/app/[local]/(manage)/network/store/network-store";
import { AgentStatus } from "@prisma/client";
import { getNewNodePosition } from "~/lib/utils";
import { useStoreApi } from "reactflow";

export function NetworkCommand() {
  const [open, setOpen] = useState(false);
  const { agents, onNodesChange, onExternalNodeNewOpen } = useStore(
    useContext(NetworkContext)!,
  );
  const flowStore = useStoreApi();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  function handleAgentAdd(agent: AgentProps) {
    const position = getNewNodePosition(flowStore.getState());

    onNodesChange([
      {
        type: "add",
        item: {
          id: agent.id,
          type: "agent",
          data: { agentId: agent.id },
          position: {
            x: position.x - 48,
            y: position.y - 48,
          },
        },
      },
    ]);

    setOpen(false);
  }

  const AgentList = ({
    agents,
    status,
  }: {
    agents: AgentProps[];
    status: AgentStatus;
  }) => {
    if (agents.length === 0) {
      return null;
    }
    return (
      <CommandGroup
        heading={
          status === AgentStatus.ONLINE
            ? "Online"
            : status === AgentStatus.OFFLINE
              ? "Offline"
              : "Unknown"
        }
      >
        {agents.map((agent) => (
          <CommandItem
            className="flex items-center"
            key={agent.id}
            onSelect={() => handleAgentAdd(agent)}
            value={agent.name}
            disabled={agent.inFlow}
          >
            <div className="flex flex-1">
              <Server className="mr-2 h-4 w-4" />
              <span>{agent.name}</span>
            </div>
            {agent.inFlow && (
              <span className="text-xs text-muted-foreground">已添加</span>
            )}
          </CommandItem>
        ))}
      </CommandGroup>
    );
  };

  return (
    <>
      <Button
        className="relative inline-flex h-8 w-full items-center justify-start whitespace-nowrap rounded-[0.5rem] border border-input bg-background px-4 py-2 text-sm font-normal text-muted-foreground shadow-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <span className="hidden lg:inline-flex">搜索添加服务器...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="rounded-lg border shadow-md" loop>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="操作">
              <CommandItem
                value="添加外部节点"
                onSelect={() => {
                  setOpen(false);
                  onExternalNodeNewOpen(true);
                }}
              >
                <CableIcon className="mr-2 h-4 w-4" />
                <span>添加外部节点</span>
                <CommandShortcut>⌘I</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <AgentList agents={agents.ONLINE} status={AgentStatus.ONLINE} />
            <AgentList agents={agents.OFFLINE} status={AgentStatus.OFFLINE} />
            <AgentList agents={agents.UNKNOWN} status={AgentStatus.UNKNOWN} />
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
