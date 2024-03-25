"use client";
import Menu from "~/app/[local]/_components/menu";
import { filteredMenus } from "~/lib/constants/menu";
import { TooltipProvider } from "~/lib/ui/tooltip";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/lib/ui/resizable";
import { type ReactNode, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { notFound, usePathname } from "next/navigation";
import { hasPermission } from "~/lib/constants/permission";
import { useResizeObserver } from "~/lib/hooks/use-resize-observer";

interface ResizableLayoutProps {
  children: ReactNode;
  session: Session;
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

export default function ResizableLayout({
  children,
  session,
  defaultLayout = [25, 75],
  defaultCollapsed,
  navCollapsedSize,
}: ResizableLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [menuWidth, setMenuWidth] = useState(defaultLayout[0] ?? 25);
  const ref = useRef<HTMLDivElement>(null);
  const { width = 0 } = useResizeObserver({
    ref,
  });

  const pathname = usePathname();
  if (!hasPermission(session, `page:${pathname}`)) {
    notFound();
  }
  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
      collapsed,
    )};path=/`;
  };

  return (
    <SessionProvider session={session}>
      <TooltipProvider delayDuration={0}>
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={(sizes: number[]) => {
            document.cookie = `react-resizable-panels:layout=${JSON.stringify(
              sizes,
            )};path=/`;
          }}
          className="h-full"
        >
          <ResizablePanel
            defaultSize={defaultLayout[0]}
            collapsedSize={navCollapsedSize}
            onResize={(size) => setMenuWidth(size)}
            collapsible={true}
            minSize={4}
            maxSize={15}
            onCollapse={() => handleCollapse(true)}
            onExpand={() => handleCollapse(false)}
            className={cn(
              "h-screen",
              isCollapsed &&
                "min-w-[50px] transition-all duration-300 ease-in-out",
            )}
          >
            <div className="h-full w-full" ref={ref}>
              <Menu
                menus={filteredMenus(session)}
                isCollapsed={isCollapsed}
                style={{ width: width === 0 ? `${menuWidth}%` : `${width}px` }}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={defaultLayout[1]}>
            {children}
          </ResizablePanel>
        </ResizablePanelGroup>
      </TooltipProvider>
    </SessionProvider>
  );
}
