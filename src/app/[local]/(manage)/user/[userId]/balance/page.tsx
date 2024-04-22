import { Separator } from "~/lib/ui/separator";
import { api } from "~/trpc/server";
import Balance from "~/app/[local]/(manage)/user/[userId]/_components/balance";
import BalanceLog from "~/app/[local]/(manage)/user/[userId]/_components/balance-log";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/lib/ui/tabs";
import { getServerAuthSession } from "~/server/auth";
import { BalanceType, Role } from "@prisma/client";
import { getTranslations } from "next-intl/server";

export default async function UserBalancePage({
  params: { userId },
}: {
  params: { userId: string };
}) {
  const t = await getTranslations("user-[userId]-balance");
  const wallet = await api.user.getWallet.query({ id: userId });
  const session = await getServerAuthSession();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t("balance")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("check_your_account_balance")}
        </p>
      </div>
      <Separator />
      <Tabs defaultValue="CONSUMPTION">
        <TabsList>
          <TabsTrigger value="CONSUMPTION">{t("balance")}</TabsTrigger>
          {session?.user.roles.includes(Role.AGENT_PROVIDER) && (
            <TabsTrigger value="INCOME">{t("earnings")}</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="CONSUMPTION" className="space-y-6">
          <Balance
            wallet={{
              balance: String(wallet?.balance.toNumber()),
              balanceType: BalanceType.CONSUMPTION,
            }}
            userId={userId}
          />
          <BalanceLog userId={userId} balanceType={BalanceType.CONSUMPTION} />
        </TabsContent>
        <TabsContent value="INCOME" className="space-y-6">
          <Balance
            wallet={{
              balance: String(wallet?.incomeBalance.toNumber()),
              balanceType: BalanceType.INCOME,
            }}
            userId={userId}
          />
          <BalanceLog userId={userId} balanceType={BalanceType.INCOME} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
