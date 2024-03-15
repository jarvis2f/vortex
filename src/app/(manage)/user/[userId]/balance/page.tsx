import { Separator } from "~/lib/ui/separator";
import { api } from "~/trpc/server";
import Balance from "~/app/(manage)/user/[userId]/_components/balance";
import BalanceLog from "~/app/(manage)/user/[userId]/_components/balance-log";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/lib/ui/tabs";
import { getServerAuthSession } from "~/server/auth";
import { BalanceType, Role } from "@prisma/client";

export default async function UserBalancePage({
  params: { userId },
}: {
  params: { userId: string };
}) {
  const wallet = await api.user.getWallet.query({ id: userId });
  const session = await getServerAuthSession();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">余额</h3>
        <p className="text-sm text-muted-foreground">查看你的账户余额</p>
      </div>
      <Separator />
      <Tabs defaultValue="CONSUMPTION">
        <TabsList>
          <TabsTrigger value="CONSUMPTION">余额</TabsTrigger>
          {session?.user.roles.includes(Role.AGENT_PROVIDER) && (
            <TabsTrigger value="INCOME">收益</TabsTrigger>
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
