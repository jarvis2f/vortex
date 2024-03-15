import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/lib/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/lib/ui/tooltip";
import React from "react";
import { cn, copyToClipboard } from "~/lib/utils";
import { type LogsOutput } from "~/lib/types/trpc";
import { getLevel } from "~/lib/constants/log-level";
import { type LogMessage } from "~/lib/types";
import { toast } from "~/lib/ui/use-toast";

export default function Log({
  log,
  showId,
}: {
  log: LogsOutput;
  showId?: boolean;
}) {
  if (!log) return null;
  const level = getLevel(String(log.level));
  const message = log.message as unknown as LogMessage;
  const msg = message.msg;
  let formatMessage = "";
  let moduleName;
  try {
    formatMessage = JSON.stringify(message, null, 2);
    moduleName = message?.module;
  } catch (e) {
    // ignore
  }
  return (
    <AccordionItem value={log.id + ""} key={log.id} className="border-none">
      <AccordionTrigger className="flex px-6 py-0 hover:bg-foreground/10 hover:no-underline">
        <div className="flex space-x-2">
          <div className="flex items-center justify-center space-x-2">
            {showId && <div className="w-10 text-left text-sm">{log.id}</div>}
            <div className={cn("w-10 py-1 text-left text-sm", level?.color)}>
              {level?.label}
            </div>
            <div className="w-[10.7rem] text-left text-sm text-foreground/50">{`${log.time.toLocaleString()} ${log.time.getMilliseconds()}`}</div>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex w-20 justify-between text-sm text-foreground/75 hover:bg-foreground/15">
                    <span>[</span>
                    <span className="overflow-hidden whitespace-nowrap">
                      {moduleName}
                    </span>
                    <span>]</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent align="center">
                  <p>{moduleName}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div
              className={cn("text-start text-sm text-foreground", level?.color)}
            >
              {msg}
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <pre
                className="cursor-pointer whitespace-pre-wrap px-6 hover:bg-foreground/10"
                onClick={() => {
                  if (window.isSecureContext && navigator.clipboard) {
                    void navigator.clipboard
                      .writeText(formatMessage)
                      .then(() => {
                        toast({
                          description: "已复制到剪贴板",
                        });
                      });
                  } else {
                    copyToClipboard(formatMessage);
                  }
                }}
              >
                {formatMessage}
              </pre>
            </TooltipTrigger>
            <TooltipContent align="start">
              <p>Copy</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </AccordionContent>
    </AccordionItem>
  );
}
