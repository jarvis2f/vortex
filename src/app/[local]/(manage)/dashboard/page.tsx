import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/lib/ui/card";
import Link from "next/link";
import UserTrafficUsage from "~/app/[local]/(manage)/dashboard/_components/traffic-usage";
import SystemStatus from "~/app/[local]/(manage)/dashboard/_components/system-status";
import { api } from "~/trpc/server";
import { MoneyInput } from "~/lib/ui/money-input";
import { MoreHorizontalIcon } from "lucide-react";
import Markdown from "react-markdown";
import { Dialog, DialogContent, DialogTrigger } from "~/lib/ui/dialog";
import { type RouterOutputs } from "~/trpc/shared";
import { getTranslations } from "next-intl/server";
import { type NamespaceKeys } from "use-intl/core";

export const metadata = {
  title: "Dashboard - vortex",
};

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }
  const t = await getTranslations("dashboard");
  const wallet = await api.user.getWallet.query({ id: session.user.id });
  const yesterdayBalanceChange = await api.user.getYesterdayBalanceChange.query(
    { id: session.user.id },
  );
  const { ANNOUNCEMENT: announcement } = await api.system.getConfig.query({
    key: "ANNOUNCEMENT",
  });

  return (
    <div className="flex h-full flex-col p-4 lg:h-screen">
      <div className="mb-6 flex items-end">
        <h1 className="mr-2 text-2xl text-muted-foreground">Welcome,</h1>
        <Link href={`/user/${session.user.id}`}>
          <h1 className="text-2xl hover:underline">
            {session.user?.name ?? session.user?.email}
          </h1>
        </Link>
        <Image
          src="/3d-fluency-hugging-face.png"
          alt="3D Fluency Hugging Face"
          width={70}
          height={70}
        />
      </div>
      <div className="flex-grow grid-cols-3 lg:grid lg:space-x-4">
        <div className="col-span-2 flex flex-col">
          <Card className="h-[300px] lg:h-3/5">
            <CardHeader>
              <CardTitle>{t("traffic_usage")}</CardTitle>
              <CardDescription>
                {t("recent_days_traffic_usage")}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative h-full w-full">
              <UserTrafficUsage />
              <Image
                className="absolute -right-[4rem] top-0 w-[200px] lg:w-[300px]"
                src="/techny-rocket.gif"
                alt="Techny Rocket"
                width={300}
                height={150}
              />
            </CardContent>
          </Card>
          <Card className="mt-4 flex-grow">
            <CardHeader>
              <CardTitle>{t("system_status")}</CardTitle>
              <CardDescription>{t("system_running_normally")}</CardDescription>
            </CardHeader>
            <CardContent className="flex">
              <Image
                className="hidden lg:block"
                src="/isometric-server-transferring-data.gif"
                alt="Isometric Server Transferring Data"
                width={170}
                height={170}
              />
              <SystemStatus />
            </CardContent>
          </Card>
        </div>
        <div className="col-span-1 mt-4 flex flex-col lg:mt-0">
          <Card className="grid grid-rows-2 lg:h-2/5">
            <UserBalance
              wallet={wallet}
              yesterdayBalanceChange={yesterdayBalanceChange}
              userId={session.user.id}
              t={t}
            />
          </Card>
          <Card className="mt-4 flex-grow overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("announcement")}</CardTitle>
              {announcement && (
                <AnnouncementDialog announcement={announcement} />
              )}
            </CardHeader>
            <CardContent className="max-h-[300px] w-full p-4">
              {announcement ? (
                <Markdown className="markdown overflow-hidden">
                  {announcement}
                </Markdown>
              ) : (
                <p>{t("no_announcement")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function UserBalance({
  userId,
  wallet,
  yesterdayBalanceChange,
  t,
}: {
  userId: string;
  wallet: RouterOutputs["user"]["getWallet"];
  yesterdayBalanceChange: RouterOutputs["user"]["getYesterdayBalanceChange"];
  t: Awaited<
    ReturnType<typeof getTranslations<NamespaceKeys<IntlMessages, "dashboard">>>
  >;
}) {
  return (
    <>
      <div className="flex flex-col border-b px-6 py-3">
        <div className="flex justify-between">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">
            {t("balance")}
          </h3>
          <Link href={`/user/${userId}/balance`}>
            <MoreHorizontalIcon className="h-6 w-6 cursor-pointer hover:bg-muted" />
          </Link>
        </div>
        <div className="flex h-full items-center space-x-6">
          <MoneyInput
            displayType="text"
            value={wallet.balance.toNumber() ?? 0.0}
            className="bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-5xl text-transparent"
          />
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">
              {t("yesterday_consumption")}
            </span>
            <span className="text-2xl">
              {yesterdayBalanceChange?.CONSUMPTION?.toNumber() ?? 0}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col px-6 py-3">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">
          {t("earnings")}
        </h3>
        <div className="flex h-full items-center space-x-6">
          <MoneyInput
            displayType="text"
            value={wallet.incomeBalance.toNumber() ?? 0.0}
            className="bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-5xl text-transparent"
          />
          <div className=" flex items-center space-x-2">
            <span className="text-muted-foreground">
              {t("yesterday_earnings")}
            </span>
            <span className="text-2xl">
              {yesterdayBalanceChange?.INCOME?.toNumber() ?? 0}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

function AnnouncementDialog({ announcement }: { announcement: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild={true}>
        <MoreHorizontalIcon className="h-6 w-6 cursor-pointer hover:bg-muted" />
      </DialogTrigger>
      <DialogContent className="h-full w-full md:h-auto md:max-w-[60%]">
        <Markdown className="markdown mt-3">{announcement}</Markdown>
      </DialogContent>
    </Dialog>
  );
}
