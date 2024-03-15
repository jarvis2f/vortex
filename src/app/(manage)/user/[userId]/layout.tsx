import { Separator } from "~/lib/ui/separator";
import { type ReactNode } from "react";
import { SidebarNav } from "~/app/_components/sidebar-nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "用户中心 - vortex",
  description: "用户中心",
};

export default function UserLayout({
  children,
  params: { userId },
}: {
  children: ReactNode;
  params: { userId: string };
}) {
  const sidebarNavItems = [
    {
      title: "个人资料",
      href: `/user/${userId}`,
    },
    {
      title: "账户",
      href: `/user/${userId}/account`,
    },
    {
      title: "余额",
      href: `/user/${userId}/balance`,
    },
  ];

  return (
    <div className="space-y-6 p-4 pb-16">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">个人中心</h2>
        <p className="text-muted-foreground">
          管理您的帐户设置并设置电子邮件首选项。
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="flex-1 lg:max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
