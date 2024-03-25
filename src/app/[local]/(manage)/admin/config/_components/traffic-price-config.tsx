import { type z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/lib/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/lib/ui/select";
import { BYTE_UNITS } from "~/lib/utils";
import React, { useEffect, useImperativeHandle } from "react";
import { type CustomComponentProps } from "~/lib/types";
import { trafficPriceSchema } from "~/lib/types/zod-schema";
import { MoneyInput } from "~/lib/ui/money-input";

export default function TrafficPriceConfig({
  value,
  onChange,
  innerRef,
}: CustomComponentProps) {
  const form = useForm<z.infer<typeof trafficPriceSchema>>({
    resolver: zodResolver(trafficPriceSchema),
    defaultValues: value ? JSON.parse(value) : undefined,
  });
  const watch = form.watch;

  useEffect(() => {
    const { unsubscribe } = watch((value) => {
      onChange(JSON.stringify(value));
    });
    return () => unsubscribe();
  }, [watch]);

  useImperativeHandle(innerRef, () => {
    return {
      async beforeSubmit() {
        return await form.trigger();
      },
    };
  });

  return (
    <Form {...form}>
      <form className="w-2/3 space-y-3 overflow-y-auto p-1">
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>价格</FormLabel>
              <FormControl>
                <MoneyInput
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>单位</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.keys(BYTE_UNITS as object)
                    .filter((key) => key !== "Bytes" && key !== "Kilobytes")
                    .map((key) => (
                      <SelectItem value={key} key={key}>
                        {key}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

export function TrafficPriceSkeleton() {
  return (
    <div className="w-2/3 space-y-3 overflow-y-auto p-1">
      <div className="h-8 animate-pulse rounded bg-gray-200" />
      <div className="h-8 animate-pulse rounded bg-gray-200" />
    </div>
  );
}
