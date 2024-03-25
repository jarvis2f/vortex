"use client";
import { Button } from "~/lib/ui/button";
import { CopyIcon } from "lucide-react";
import { cn, copyToClipboard } from "~/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/lib/ui/tooltip";
import dayjs from "dayjs";
import { useTranslations } from "use-intl";

interface IDProps {
  id: string;
  createdAt?: Date;
  copy?: boolean;
}

export default function ID({ id, createdAt, copy = true }: IDProps) {
  if (!id) return null;
  const t = useTranslations("global_id");
  const shortId = id.length > 10 ? id.slice(0, 4) + " ... " + id.slice(-6) : id;
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <div className={cn("flex w-fit flex-col gap-1")}>
          <p className="text-sm">
            {shortId}
            {copy && (
              <Button
                variant="ghost"
                className="ml-2 h-5 px-1 text-center"
                onClick={(e) => {
                  e.preventDefault();
                  copyToClipboard(id);
                }}
              >
                <CopyIcon className="h-3 w-3" />
              </Button>
            )}
          </p>
          {createdAt && (
            <p className="text-xs text-muted-foreground">
              {t("created-at")} {dayjs(createdAt).locale("zh-cn").fromNow()}
            </p>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="flex items-center gap-4">
        {id}
      </TooltipContent>
    </Tooltip>
  );
}
