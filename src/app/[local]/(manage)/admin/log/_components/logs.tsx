"use client";
import React, { useEffect } from "react";
import { ScrollArea } from "~/lib/ui/scroll-area";
import { Accordion } from "~/lib/ui/accordion";
import { api } from "~/trpc/react";
import { useLogStore } from "~/app/[local]/(manage)/admin/log/store/log-store";
import LogGlance from "~/app/[local]/(manage)/admin/log/_components/log-glance";
import Log from "~/app/[local]/(manage)/admin/log/_components/log";
import LogToolbar from "~/app/[local]/(manage)/admin/log/_components/log-toolbar";
import type { LogsOutput } from "~/lib/types/trpc";
import SearchEmptyState from "~/app/[local]/_components/search-empty-state";

export function Logs({ agentId }: { agentId?: string }) {
  const { convertParams, setParams, params } = useLogStore();

  useEffect(() => {
    if (agentId) {
      setParams({
        ...params,
        agentId,
      });
    }
  }, [agentId]);

  const getLogs = api.log.getLogs.useInfiniteQuery(
    {
      ...convertParams(),
      agentId: agentId,
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

  const LogPulse = () => {
    return (
      <div className="flex flex-col space-y-2">
        <div className="flex h-5 animate-pulse space-x-2 px-6 py-0 ">
          <div className="w-10 bg-slate-200 p-1"></div>
          <div className="w-10 bg-slate-200 p-1"></div>
          <div className="w-[11rem] bg-slate-200"></div>
          <div className="w-20 bg-slate-200"></div>
          <div className="flex-1 bg-slate-200"></div>
        </div>
        <div className="flex h-5 animate-pulse space-x-2 px-6 py-0 ">
          <div className="w-10 bg-slate-200 p-1"></div>
          <div className="w-10 bg-slate-200 p-1"></div>
          <div className="w-[11rem] bg-slate-200"></div>
          <div className="w-20 bg-slate-200"></div>
          <div className="flex-1 bg-slate-200"></div>
        </div>
        <div className="flex h-5 animate-pulse space-x-2 px-6 py-0 ">
          <div className="w-10 bg-slate-200 p-1"></div>
          <div className="w-10 bg-slate-200 p-1"></div>
          <div className="w-[11rem] bg-slate-200"></div>
          <div className="w-20 bg-slate-200"></div>
        </div>
      </div>
    );
  };

  return (
    <>
      <LogToolbar />
      <div className="mt-3 flex h-[calc(100vh_-_8rem)] w-full rounded-md border p-3">
        <ScrollArea className="flex-1" onViewScroll={handleScroll}>
          <div className="flex flex-col">
            {getLogs.data?.pages.length === 1 &&
            getLogs.data.pages[0]!.logs.length === 0 ? (
              <SearchEmptyState />
            ) : (
              <Accordion type="single" collapsible>
                {getLogs.data?.pages.map((page) => {
                  return page.logs.map((log: LogsOutput) => {
                    return <Log log={log} key={log.id} showId={true} />;
                  });
                })}
              </Accordion>
            )}
            {getLogs.isLoading && <LogPulse />}
          </div>
        </ScrollArea>
        <LogGlance />
      </div>
    </>
  );
}
