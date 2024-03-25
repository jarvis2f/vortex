import { Popover, PopoverContent, PopoverTrigger } from "~/lib/ui/popover";
import { buttonVariants } from "~/lib/ui/button";
import { SettingsIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/lib/ui/select";
import { ForwardMethod } from ".prisma/client";
import { useStore } from "zustand";
import { useContext, useMemo, useState } from "react";
import { NetworkContext } from "~/app/[local]/(manage)/network/store/network-store";
import { type NetworkAgentEdge } from "~/lib/types/agent";
import { Input } from "~/lib/ui/input";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/lib/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "~/lib/utils";
import { WithDescSelector } from "~/app/[local]/_components/with-desc-selector";
import { ForwardMethodOptions, GostChannelOptions } from "~/lib/constants";
import { api } from "~/trpc/react";

const portNumberSchema = z.preprocess(
  (a) => (a ? Number(a) : undefined),
  z
    .number()
    .positive()
    .min(1, {
      message: "监听端口必须大于 0",
    })
    .max(65535, {
      message: "监听端口必须小于 65536",
    }),
);

const forwardSettingsSchema = z.object({
  outPort: portNumberSchema.optional(),
  inPort: portNumberSchema.optional(),
  method: z.nativeEnum(ForwardMethod, { required_error: "必须选择转发方式" }),
  channel: z.string().optional(),
});

export default function AgentEdgeForwardSettings({
  edgeId,
  data,
}: {
  edgeId: string;
  data?: NetworkAgentEdge;
}) {
  const [open, setOpen] = useState(false);
  const { onEdgeDataChange, checkIsForward2Agent, findEdge } = useStore(
    useContext(NetworkContext)!,
  );

  const edge = findEdge(edgeId);
  const isForward2Agent = useMemo(() => {
    return checkIsForward2Agent(edgeId);
  }, [edgeId]);

  const { data: sourceAgentConfig } = api.system.getConfig.useQuery({
    relationId: edge?.source,
    keys: ["AGENT_PORT_RANGE", "AGENT_SUPPORT_DIRECT"],
  });

  const formSchema = useMemo(() => {
    if (!isForward2Agent) {
      return forwardSettingsSchema.extend({
        inPort: z.preprocess(
          (a) => (a ? Number(a) : undefined),
          z
            .number({
              required_error: "必须填写转发端口",
            })
            .positive()
            .min(1, {
              message: "目标端口必须大于 0",
            })
            .max(65535, {
              message: "目标端口必须小于 65536",
            }),
        ),
      });
    }
    return forwardSettingsSchema;
  }, [isForward2Agent]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: data,
  });

  const methodWatch = form.watch("method");

  async function handleOpenChange(open: boolean) {
    if (!open) {
      const result = await form.trigger();
      if (result) {
        onEdgeDataChange(edgeId, form.getValues());
      } else {
        return;
      }
    }
    setOpen(open);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        className={cn(buttonVariants({ variant: "ghost" }), "h-auto p-1")}
      >
        <SettingsIcon className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent className="w-[26rem]">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">中转设置</h4>
          </div>
          <div className="grid gap-2">
            <Form {...form}>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="outPort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>监听端口</FormLabel>
                        <FormDescription>
                          端口范围 {sourceAgentConfig?.AGENT_PORT_RANGE}
                        </FormDescription>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="默认随机"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="inPort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isForward2Agent ? "监听端口" : "转发端口"}
                        </FormLabel>
                        <FormDescription>1-65535</FormDescription>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder={
                              isForward2Agent
                                ? "默认随机"
                                : "填写你需要转发的端口"
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>转发方式</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ForwardMethodOptions.filter(({ value }) => {
                              if (value === ForwardMethod.IPTABLES) {
                                return (
                                  String(
                                    sourceAgentConfig?.AGENT_SUPPORT_DIRECT,
                                  ) === "true"
                                );
                              }
                              return true;
                            }).map(({ label, value }) => (
                              <SelectItem value={value} key={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {methodWatch === "GOST" && isForward2Agent && (
                    <FormField
                      control={form.control}
                      name="channel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>通道</FormLabel>
                          <FormControl>
                            <WithDescSelector
                              className="col-span-2"
                              options={GostChannelOptions}
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </form>
            </Form>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
