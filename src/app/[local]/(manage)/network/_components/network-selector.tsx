"use client";

import * as React from "react";
import { useContext } from "react";
import { type PopoverProps } from "@radix-ui/react-popover";

import { cn } from "~/lib/utils";
import { Button } from "~/lib/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/lib/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "~/lib/ui/popover";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useStore } from "zustand";
import { NetworkContext } from "~/app/[local]/(manage)/network/store/network-store";
import Link from "next/link";
import { type NetworkGetOneOutput } from "~/lib/types/trpc";

interface NetworkSelectorProps extends PopoverProps {
  networks: NetworkGetOneOutput[];
}

export function NetworkSelector({ networks, ...props }: NetworkSelectorProps) {
  const { network, onNetworkChange } = useStore(useContext(NetworkContext)!);
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} {...props}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-label="Load a network..."
          aria-expanded={open}
          className="flex-1 justify-between md:max-w-[200px] lg:max-w-[300px]"
        >
          {network ? network.name : "Load a network..."}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search network..." />
          <CommandEmpty>No networks found.</CommandEmpty>
          <CommandGroup heading="Networks">
            {networks?.map((item) => (
              <Link href={`/network?id=${item.id}`} key={item.id} passHref>
                <CommandItem
                  onSelect={() => {
                    onNetworkChange(item);
                    setOpen(false);
                  }}
                >
                  {item.name}
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      network?.id === item.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              </Link>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
