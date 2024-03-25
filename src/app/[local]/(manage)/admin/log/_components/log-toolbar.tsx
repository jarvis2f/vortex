"use client";
import { Input } from "~/lib/ui/input";
import { Button } from "~/lib/ui/button";
import { ChevronDown, ClockIcon, XIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "~/lib/ui/popover";
import { Label } from "~/lib/ui/label";
import React from "react";
import { LEVELS } from "~/lib/constants/log-level";
import { useLogStore } from "~/app/[local]/(manage)/admin/log/store/log-store";
import LogDelete from "~/app/[local]/(manage)/admin/log/_components/log-delete";
import { FacetedFilter } from "~/app/[local]/_components/faceted-filter";
import LogSearchKeyword from "~/app/[local]/(manage)/admin/log/_components/log-search-keyword";

export default function LogToolbar() {
  const { params, setParams, resetParams, isFiltering } = useLogStore();
  const [hasNewLog, setHasNewLog] = React.useState(false);
  // TODO: 增加日志展示字段的配置
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <FacetedFilter
          title="Level"
          options={LEVELS}
          value={new Set(params.levels)}
          onChange={(v) =>
            setParams({
              ...params,
              levels: Array.from(v ?? []),
            })
          }
        />
        <Popover modal>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex h-8 space-x-1 px-2">
              {params.startDate || params.endDate ? (
                <span className="whitespace-nowrap text-foreground/50">
                  {params.startDate} - {params.endDate}
                </span>
              ) : (
                <ClockIcon className="h-4 w-4 rotate-0 scale-100 text-foreground/50" />
              )}
              <ChevronDown className="h-4 w-4 rotate-0 scale-100 text-foreground/50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="width">Start Date</Label>
                <Input
                  value={params.startDate}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      startDate: e.target.value,
                    })
                  }
                  className="col-span-2 h-8"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="width">End Date</Label>
                <Input
                  value={params.endDate}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      endDate: e.target.value,
                    })
                  }
                  className="col-span-2 h-8"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <LogSearchKeyword />
        {isFiltering() && (
          <Button
            variant="ghost"
            onClick={() => resetParams()}
            className="h-8 px-2 lg:px-3"
          >
            重置
            <XIcon className="ml-2 h-4 w-4" />
          </Button>
        )}
        {hasNewLog && (
          <Button
            variant="ghost"
            onClick={() => {
              setHasNewLog(false);
              resetParams();
            }}
            className="h-8 px-2 lg:px-3"
          >
            有新日志
          </Button>
        )}
      </div>
      <LogDelete />
    </div>
  );
}
