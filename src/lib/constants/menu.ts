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
    title: "控制台",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    title: "转发",
    href: "/forward",
    icon: OrbitIcon,
  },
  {
    title: "服务器",
    href: "/agent",
    icon: ServerIcon,
  },
  {
    title: "组网",
    href: "/network",
    icon: NetworkIcon,
  },
  {
    title: "工单",
    href: "/ticket",
    icon: TicketIcon,
  },
  {
    title: "管理",
    children: [
      {
        title: "用户",
        href: "/admin/users",
        icon: UserIcon,
      },
      {
        title: "统计",
        href: env.NEXT_PUBLIC_UMAMI_URL ?? "/not-found",
        icon: LineChartIcon,
      },
    ],
  },
  {
    title: "系统",
    children: [
      {
        title: "日志",
        href: "/admin/log",
        icon: LibraryBigIcon,
      },
      {
        title: "配置",
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
