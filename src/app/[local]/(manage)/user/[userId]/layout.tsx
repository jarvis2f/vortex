import { Separator } from "~/lib/ui/separator";
import { type ReactNode } from "react";
import { SidebarNav } from "~/app/[local]/_components/sidebar-nav";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "用户中心 - vortex",
  description: "用户中心",
};

export default async function UserLayout({
  children,
  params: { userId },
}: {
  children: ReactNode;
  params: { userId: string };
}) {
  const t = await getTranslations("user-[userId]-layout");
  const sidebarNavItems = [
    {
      title: t("profile"),
      href: `/user/${userId}`,
    },
    {
      title: t("account"),
      href: `/user/${userId}/account`,
    },
    {
      title: t("balance"),
      href: `/user/${userId}/balance`,
    },
  ];

  return (
    <div className="space-y-6 p-4 pb-16">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">
          {t("user_center")}
        </h2>
        <p className="text-muted-foreground">
          {t("manage_account_settings_email_preferences")}
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
