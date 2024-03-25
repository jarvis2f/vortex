"use client";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "~/lib/ui/navigation-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { cn } from "~/lib/utils";
import { useSession } from "next-auth/react";
import AgentCommand from "~/app/[local]/(manage)/agent/_components/agent-command";
import AgentDelete from "~/app/[local]/(manage)/agent/_components/agent-delete";
import { type Agent } from ".prisma/client";
import { Role } from "@prisma/client";

export default function AgentMenu({ agent }: { agent: Agent }) {
  const value = usePathname();
  const { data: session } = useSession();
  if (!session) {
    return null;
  }
  const isAgentProvider = session.user.roles.includes("AGENT_PROVIDER");
  const agentId = agent.id;
  const isUnknown = agent?.status === "UNKNOWN";
  const isOnline = agent?.status === "ONLINE";

  return (
    <div className="flex w-full justify-between border-b bg-background px-3 py-1">
      <NavigationMenu defaultValue={value}>
        <NavigationMenuList>
          {!isUnknown && (
            <>
              <NavigationMenuItem>
                <Link
                  href={`/agent/${agentId}/status`}
                  className={navigationMenuTriggerStyle()}
                >
                  状态
                </Link>
              </NavigationMenuItem>
              {isAgentProvider && (
                <>
                  <NavigationMenuItem>
                    <Link
                      href={`/agent/${agentId}/forward`}
                      className={navigationMenuTriggerStyle()}
                    >
                      转发
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>配置</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[300px] space-y-2 p-3">
                        <Link
                          href={`/agent/${agentId}/config/base`}
                          className={cn(
                            navigationMenuTriggerStyle(),
                            "flex space-x-2",
                          )}
                        >
                          <div className="font-medium leading-none">
                            基础信息
                          </div>
                          <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                            服务器名称、备注等
                          </p>
                        </Link>
                        <Link
                          href={`/agent/${agentId}/config/other`}
                          className={cn(
                            navigationMenuTriggerStyle(),
                            "flex space-x-2",
                          )}
                        >
                          <div className="font-medium leading-none">
                            其它设置
                          </div>
                          <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                            价格、端口、日志等配置
                          </p>
                        </Link>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link
                      href={`/agent/${agentId}/log`}
                      className={navigationMenuTriggerStyle()}
                    >
                      日志
                    </Link>
                  </NavigationMenuItem>
                </>
              )}
            </>
          )}
          {isAgentProvider && (
            <NavigationMenuItem>
              <Link
                href={`/agent/${agentId}/install`}
                className={navigationMenuTriggerStyle()}
              >
                安装
              </Link>
            </NavigationMenuItem>
          )}
        </NavigationMenuList>
      </NavigationMenu>
      {isAgentProvider && (
        <div className="flex flex-row">
          {isOnline && session.user.roles.includes(Role.ADMIN) && (
            <AgentCommand currentAgentId={agentId} />
          )}
          <AgentDelete currentAgentId={agentId} />
        </div>
      )}
    </div>
  );
}
