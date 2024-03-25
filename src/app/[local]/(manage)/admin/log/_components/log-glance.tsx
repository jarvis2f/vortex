import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/lib/ui/tooltip";
import { BarChartHorizontalIcon } from "lucide-react";
import React from "react";
import { cn } from "~/lib/utils";
import { useLogStore } from "~/app/[local]/(manage)/admin/log/store/log-store";
import { api } from "~/trpc/react";

export default function LogGlance() {
  const { params, setParams, convertParams } = useLogStore();

  const getLogGlance = api.log.getLogGlance.useQuery({
    ...convertParams(),
  });

  const renderTimeAxis = () => {
    let lastTime: Date;
    const length = getLogGlance.data?.timeAxis.length ?? 0;
    return getLogGlance.data?.timeAxis.map((time: Date, i: number) => {
      const timeString =
        time.toDateString() === lastTime?.toDateString()
          ? `${time.getHours()}:${time.getMinutes()}`
          : `${time.getMonth() + 1} / ${time.getDate()}`;
      lastTime = time;
      const top = i === 0 ? 0 : i === length - 1 ? 90 : (i / (length - 1)) * 90;
      return (
        <span
          key={i}
          className={cn(
            "absolute right-[3px] whitespace-nowrap after:mr-[-4px] after:text-slate-100 after:content-['-'] after:dark:text-slate-600",
          )}
          style={{ top: `${top}%` }}
        >
          {timeString}
        </span>
      );
    });
  };

  const renderTimeAxisData = () => {
    const timeAxisData = getLogGlance.data?.timeAxisData;
    if (!timeAxisData || timeAxisData.length === 0) return null;
    const max = timeAxisData.reduce((prev, curr) =>
      prev.count > curr.count ? prev : curr,
    ).count;
    const min = timeAxisData.reduce((prev, curr) =>
      prev.count < curr.count ? prev : curr,
    ).count;
    return timeAxisData.map((data, i) => {
      const width = ((data.count - min) / (max - min)) * 100;
      return (
        <TooltipProvider delayDuration={100} key={i}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="group relative h-[11px] hover:cursor-pointer"
                onClick={() => {
                  setParams({
                    ...params,
                    startDate: data.start.toLocaleString(),
                    endDate: data.end.toLocaleString(),
                  });
                }}
              >
                <div className="h-[6px]"></div>
                <div className="h-[7px]">
                  <div
                    className={cn(
                      "h-full min-w-[6px] rounded-[2px] bg-slate-200 transition-[width,background-color] duration-75 group-hover:bg-sky-500 dark:bg-slate-600",
                    )}
                    style={{ width: `${width}%` }}
                  ></div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={10}
              className="flex h-[98px] w-[222px] flex-col p-0"
            >
              <div className="flex flex-col border-b border-slate-200 py-2 dark:border-slate-600">
                <div className="flex flex-grow-[2] flex-col justify-evenly px-2">
                  <div className="mb-[8px] flex flex-row items-center">
                    <div className="ml-[3px] mr-[12px] h-[9px] w-[10px] rounded-full border border-slate-400 after:absolute after:top-[25px] after:ml-[3px] after:h-[14px] after:rounded-sm after:border-r after:border-slate-400 dark:border-slate-400 after:dark:border-slate-400"></div>
                    <div className="inline-flex w-full flex-row justify-between">
                      <div className="text-slate-500 dark:text-slate-200">
                        {data.start.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row items-center">
                    <div className="ml-[3px] mr-[12px] h-[9px] w-[10px] rounded-full bg-slate-600 dark:bg-slate-400"></div>
                    <div className="inline-flex w-full flex-row justify-between">
                      <div className="text-slate-500 dark:text-slate-200">
                        {data.end.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-grow items-center bg-slate-50 px-2 dark:bg-slate-700">
                <BarChartHorizontalIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 text-slate-300 dark:text-slate-200" />
                <span className="font-medium text-slate-300 dark:text-slate-200">
                  {data.count} logs
                </span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    });
  };

  return (
    <div className="hidden h-full min-w-[140px] flex-row border-l border-slate-100 md:flex dark:border-slate-700">
      <div className="relative min-w-[60px] select-none border-r border-slate-100 pr-[4px] text-right text-sm text-primary/20 dark:border-slate-700">
        {renderTimeAxis()}
      </div>
      <div className="min-w-[79px] select-none pl-[6px]">
        {renderTimeAxisData()}
      </div>
    </div>
  );
}
