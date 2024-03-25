"use client";
import {
  LayoutDashboardIcon,
  LibraryBigIcon,
  LineChartIcon,
  NetworkIcon,
  OrbitIcon,
  ServerIcon,
  Settings2Icon,
  TicketIcon,
  UserIcon,
} from "lucide-react";
import { type Menu } from "~/lib/types";
import { type Session } from "next-auth";
import { hasPermission } from "~/lib/constants/permission";
import { env } from "~/env";

const menus: Menu[] = [
  {
    title: "dashboard",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    title: "forward",
    href: "/forward",
    icon: OrbitIcon,
  },
  {
    title: "agent",
    href: "/agent",
    icon: ServerIcon,
  },
  {
    title: "network",
    href: "/network",
    icon: NetworkIcon,
  },
  {
    title: "ticket",
    href: "/ticket",
    icon: TicketIcon,
  },
  {
    title: "manage",
    children: [
      {
        title: "users",
        href: "/admin/users",
        icon: UserIcon,
      },
      {
        title: "statistics",
        href: env.NEXT_PUBLIC_UMAMI_URL ?? "/not-found",
        icon: LineChartIcon,
      },
    ],
  },
  {
    title: "system",
    children: [
      {
        title: "log",
        href: "/admin/log",
        icon: LibraryBigIcon,
      },
      {
        title: "config",
        href: "/admin/config",
        icon: Settings2Icon,
      },
    ],
  },
];

export const filteredMenus = (session: Session) => {
  return menus.filter((menu) => {
    if (!hasPermission(session, `page:${menu.href}`)) {
      return false;
    }
    if (menu.children) {
      menu.children = menu.children.filter((child) => {
        return hasPermission(session, `page:${child.href}`);
      });
      if (menu.children.length === 0) {
        return false;
      }
    }
    return true;
  });
};
