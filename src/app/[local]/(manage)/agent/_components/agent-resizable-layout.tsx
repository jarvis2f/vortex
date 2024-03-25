"use client";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/lib/ui/resizable";
import AgentListAside from "~/app/[local]/(manage)/agent/_components/agent-list-aside";
import { type AgentGetAllOutput } from "~/lib/types/trpc";
import { type ReactNode, useRef } from "react";
import { useResizeObserver } from "~/lib/hooks/use-resize-observer";

interface AgentLayoutProps {
  agents: AgentGetAllOutput;
  agentId: string;
  children: ReactNode;
}

export default function AgentResizableLayout({
  agents,
  agentId,
  children,
}: AgentLayoutProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { width = 0 } = useResizeObserver({
    ref,
  });

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="flex h-full flex-row"
    >
      <ResizablePanel
        defaultSize={23}
        minSize={15}
        maxSize={30}
        className="h-screen"
      >
        <div className="w-full" ref={ref}>
          <AgentListAside
            agents={agents}
            agentId={agentId}
            style={{ width: width === 0 ? "22%" : `${width}px` }}
          />
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={77}>{children}</ResizablePanel>
    </ResizablePanelGroup>
  );
}
