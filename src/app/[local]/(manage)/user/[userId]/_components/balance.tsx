"use client";
import { Card, CardContent, CardFooter, CardHeader } from "~/lib/ui/card";
import UpdateBalance from "~/app/[local]/(manage)/user/[userId]/_components/update-balance";
import { useSession } from "next-auth/react";
import { hasPermission } from "~/lib/constants/permission";
import RechargeBalance from "~/app/[local]/(manage)/user/[userId]/_components/recharge-balance";
import { MoneyInput } from "~/lib/ui/money-input";
import { BalanceType } from "@prisma/client";
import WithdrawalBalance from "~/app/[local]/(manage)/user/[userId]/_components/withdrawal-balance";
import { useTranslations } from "use-intl";

interface BalanceProps {
  wallet: {
    balance: string;
    balanceType: BalanceType;
  } | null;
  userId: string;
}

export default function Balance({ wallet, userId }: BalanceProps) {
  const { data: session } = useSession();
  const t = useTranslations("user-[userId]-balance");
  return (
    <Card>
      <CardHeader>
        {wallet?.balanceType === BalanceType.CONSUMPTION
          ? t("available_balance")
          : t("earnings_amount")}
      </CardHeader>
      <CardContent>
        <MoneyInput displayType="text" value={wallet?.balance} />
      </CardContent>
      <CardFooter className="flex justify-end gap-3">
        {wallet?.balanceType === BalanceType.CONSUMPTION && (
          <RechargeBalance userId={userId} />
        )}
        {wallet?.balanceType === BalanceType.INCOME && (
          <WithdrawalBalance balance={wallet?.balance} />
        )}
        {hasPermission(session!, "page:button:updateBalance") && (
          <UpdateBalance userId={userId} balanceType={wallet?.balanceType} />
        )}
      </CardFooter>
    </Card>
  );
}
