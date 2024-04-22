"use client";
import { Card, CardContent, CardHeader } from "~/lib/ui/card";
import { ScrollArea } from "~/lib/ui/scroll-area";
import { api } from "~/trpc/react";
import React from "react";
import { formatDate } from "~/lib/utils";
import SearchEmptyState from "~/app/[local]/_components/search-empty-state";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/lib/ui/tooltip";
import type { RouterOutputs } from "~/trpc/shared";
import { MoneyInput } from "~/lib/ui/money-input";
import { type BalanceType } from "@prisma/client";
import { useTranslations } from "use-intl";

export default function BalanceLog({
  userId,
  balanceType,
}: {
  userId: string;
  balanceType?: BalanceType;
}) {
  const t = useTranslations("user-[userId]-balance-log");
  const getLogs = api.user.getBalanceLogs.useInfiniteQuery(
    {
      id: userId,
      balanceType: balanceType,
    },
    {
      getNextPageParam: (lastPage) => {
        return lastPage.nextCursor;
      },
    },
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
    const scrollable = e.currentTarget;
    const bottomReached =
      scrollable.scrollHeight - scrollable.scrollTop ===
      scrollable.clientHeight;
    if (bottomReached && getLogs.hasNextPage && !getLogs.isFetching) {
      void getLogs.fetchNextPage();
    }
  };

  const LogExtra = ({
    extra,
    relatedInfo,
  }: {
    extra: string | null;
    relatedInfo: any;
  }) => (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <p className="col-span-2 w-[90%] overflow-hidden text-ellipsis text-sm">
          {extra}
        </p>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[400px] break-words">
        <p>{extra}</p>
        {relatedInfo && (
          <pre className="overflow-y-scroll text-xs text-muted-foreground">
            {JSON.stringify(relatedInfo, null, 2)}
          </pre>
        )}
      </TooltipContent>
    </Tooltip>
  );

  const LogItem = ({
    log,
  }: {
    log: RouterOutputs["user"]["getBalanceLogs"]["logs"][0];
  }) => (
    <div className="border-b">
      <div className="flex items-center space-x-2 py-1 hover:bg-foreground/10 hover:no-underline">
        <div className="w-[170px] text-left text-sm">
          {formatDate(log.createdAt)}
        </div>
        <div className="grid flex-1 grid-cols-4 gap-2">
          <div className="flex items-center gap-1">
            <MoneyInput
              displayType="text"
              className="text-left text-sm"
              value={log.amount}
            />
          </div>
          <MoneyInput
            displayType="text"
            className="text-left text-sm"
            value={log.afterBalance}
          />
          <LogExtra extra={log.extra} relatedInfo={log.relatedInfo} />
        </div>
      </div>
    </div>
  );

  const LogPulse = () => (
    <div className="flex items-center space-x-2 py-1">
      <div className="h-5 w-[170px] animate-pulse bg-slate-200"></div>
      <div className="grid h-5 flex-1 animate-pulse grid-cols-4 gap-2">
        <div className="bg-slate-200"></div>
        <div className="bg-slate-200"></div>
        <div className="col-span-2 bg-slate-200"></div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>{t("balance_history")}</CardHeader>
      <CardContent>
        <div className="border-b">
          <div className="flex space-x-2 py-1 text-left text-sm text-muted-foreground">
            <div className="w-[170px]">{t("time")}</div>
            <div className="grid flex-1 grid-cols-4 gap-2">
              <p>{t("change_amount")}</p>
              <p>{t("balance")}</p>
              <p className="col-span-2">{t("other_info")}</p>
            </div>
          </div>
        </div>
        <ScrollArea onViewScroll={handleScroll} className="h-[250px]">
          <div className="flex flex-col">
            {getLogs.data?.pages.length === 1 &&
            getLogs.data.pages[0]!.logs.length === 0 ? (
              <SearchEmptyState width={80} height={80} className="mt-5" />
            ) : (
              <>
                {getLogs.data?.pages.map((page) => {
                  return page.logs.map((log) => (
                    <LogItem log={log} key={log.id} />
                  ));
                })}
              </>
            )}
            {getLogs.isLoading && <LogPulse />}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
