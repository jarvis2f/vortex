"use client";

import * as React from "react";
import { useEffect } from "react";
import { type PopoverProps } from "@radix-ui/react-popover";

import { cn } from "~/lib/utils";
import { Button } from "~/lib/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/lib/ui/command";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/lib/ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "~/lib/ui/popover";

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

interface WithDescSelectorProps extends PopoverProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  options: OptionType[];
}

export interface OptionType {
  label: string;
  value: string;
  description: string;
}

export function WithDescSelector({
  value,
  onChange,
  className,
  options,
  ...props
}: WithDescSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState<OptionType>();
  const [peekedOption, setPeekedOption] = React.useState<OptionType>();

  useEffect(() => {
    if (value) {
      setSelectedOption(options.find((c) => c.value === value));
    }
  }, [value]);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen} {...props}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="选择一个通道"
            className="w-full justify-between font-normal"
          >
            {selectedOption?.label ?? "选择一个通道"}
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[250px] p-0">
          <HoverCard>
            <HoverCardContent
              side="left"
              align="start"
              forceMount
              className="min-h-[280px]"
            >
              <div className="grid gap-2">
                <h4 className="font-medium leading-none">
                  {peekedOption?.label}
                </h4>
                <div className="text-sm text-muted-foreground">
                  {peekedOption?.description}
                </div>
              </div>
            </HoverCardContent>
            <Command loop>
              <CommandList className="h-[var(--cmdk-list-height)] max-h-[400px] overflow-y-auto">
                <CommandInput placeholder="搜索 ..." />
                <CommandEmpty>无数据</CommandEmpty>
                <HoverCardTrigger />
                {options.map((Option) => (
                  <WithDescSelectorOptionItem
                    key={Option.value}
                    Option={Option}
                    isSelected={selectedOption?.value === Option.value}
                    onPeek={(model) => setPeekedOption(model)}
                    onSelect={() => {
                      setSelectedOption(Option);
                      onChange?.(Option.value);
                      setOpen(false);
                    }}
                  />
                ))}
              </CommandList>
            </Command>
          </HoverCard>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface OptionItemProps {
  Option: OptionType;
  isSelected: boolean;
  onSelect: () => void;
  onPeek: (Option: OptionType) => void;
}

export default function WithDescSelectorOptionItem({
  Option,
  isSelected,
  onSelect,
  onPeek,
}: OptionItemProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  useMutationObserver(ref, (mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes") {
        if (mutation.attributeName === "aria-selected") {
          onPeek(Option);
        }
      }
    }
  });

  return (
    <CommandItem
      key={Option.value}
      onSelect={onSelect}
      ref={ref}
      className="aria-selected:bg-primary aria-selected:text-primary-foreground"
    >
      {Option.label}
      <CheckIcon
        className={cn(
          "ml-auto h-4 w-4",
          isSelected ? "opacity-100" : "opacity-0",
        )}
      />
    </CommandItem>
  );
}

const useMutationObserver = (
  ref: React.MutableRefObject<HTMLElement | null>,
  callback: MutationCallback,
  options = {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
  },
) => {
  React.useEffect(() => {
    if (ref.current) {
      const observer = new MutationObserver(callback);
      observer.observe(ref.current, options);
      return () => observer.disconnect();
    }
  }, [ref, callback, options]);
};
