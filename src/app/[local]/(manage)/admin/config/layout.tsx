import { Separator } from "~/lib/ui/separator";
import { type ReactNode } from "react";
import { SidebarNav } from "~/app/[local]/_components/sidebar-nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "系统配置 - vortex",
};

export default function ConfigLayout({ children }: { children: ReactNode }) {
  const sidebarNavItems = [
    {
      title: "通用",
      href: `/admin/config/appearance`,
    },
    {
      title: "节点相关配置",
      href: `/admin/config/agent`,
    },
    {
      title: "日志配置",
      href: `/admin/config/log`,
    },
    {
      title: "支付记录",
      href: `/admin/config/payment`,
    },
    {
      title: "充值码",
      href: `/admin/config/recharge-code`,
    },
    {
      title: "提现记录",
      href: `/admin/config/withdraw`,
    },
  ];

  return (
    <div className="space-y-6 p-10 pb-16">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">系统配置</h2>
        <p className="text-muted-foreground">
          网站系统配置，包括日志配置、通用配置等。
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
