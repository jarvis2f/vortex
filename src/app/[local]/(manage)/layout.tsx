import { type ReactNode } from "react";
import ResizableLayout from "~/app/[local]/_components/resizable-layout";
import { cookies } from "next/headers";
import { getServerAuthSession } from "~/server/auth";
import { redirect } from "next/navigation";

export default async function ManageLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/auth/signin");
  }

  const layout = cookies().get("react-resizable-panels:layout");
  const collapsed = cookies().get("react-resizable-panels:collapsed");

  const defaultLayout = layout ? JSON.parse(layout.value) : undefined;
  const defaultCollapsed = collapsed ? JSON.parse(collapsed.value) : undefined;

  return (
    <ResizableLayout
      children={children}
      session={session}
      defaultLayout={defaultLayout}
      defaultCollapsed={defaultCollapsed}
      navCollapsedSize={4}
    />
  );
}
