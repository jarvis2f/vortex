"use client";
import { type ReactNode, useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/lib/ui/button";
import { ForwardMethod } from ".prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/lib/ui/form";
import { Input } from "~/lib/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/lib/ui/select";
import { Textarea } from "~/lib/ui/textarea";
import { Switch } from "~/lib/ui/switch";
import { Label } from "~/lib/ui/label";
import { cn } from "~/lib/utils";
import {
  forwardFormSchema,
  type ForwardFormValues,
} from "~/app/[local]/(manage)/forward/_components/forward-new-form-schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/lib/ui/dialog";
import { ForwardMethodOptions } from "~/lib/constants";
import { useTrack } from "~/lib/hooks/use-track";

export default function ForwardNew({
  trigger,
  agentId,
}: {
  trigger: ReactNode;
  agentId?: string;
}) {
  const utils = api.useUtils();
  const createMutation = api.forward.create.useMutation({
    onSuccess: (data) => {
      if (data.result.success) {
        void utils.forward.getAll.refetch();
      }
    },
  });
  const { data: agentOptions } = api.agent.getOptions.useQuery();
  const [moreConfig, setMoreConfig] = useState(false);
  const { track } = useTrack();

  const defaultValues = {
    agentId: agentId ?? "",
    method: ForwardMethod.IPTABLES,
    options: {
      proxyProtocol: {
        enabled: false,
        version: "2", // 默认V2版本
        send: false, // 新增：是否启用发送
        receive: false, // 新增：是否启用接收
      },
    },
    agentPort: undefined,
    targetPort: undefined,
    target: "",
    remark: "",
  };

  const form = useForm<ForwardFormValues>({
    resolver: zodResolver(forwardFormSchema),
    defaultValues: defaultValues,
  });

  const { data: agentConfig } = api.system.getConfig.useQuery({
    relationId: form.getValues("agentId"),
    keys: ["AGENT_PORT_RANGE", "AGENT_SUPPORT_DIRECT"],
  });
  const agentPortRange = agentConfig?.AGENT_PORT_RANGE
    ? {
        min: Number(agentConfig.AGENT_PORT_RANGE.split("-")[0]),
        max: Number(agentConfig.AGENT_PORT_RANGE.split("-")[1]),
      }
    : undefined;

  function handleSubmit(values: ForwardFormValues) {
    track("forward-submit-button", {
      ...values,
    });
    void createMutation.mutateAsync({
      ...values,
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-max">
        <DialogHeader>
          <DialogTitle>新增转发</DialogTitle>
          <DialogDescription>请填写转发信息</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="max-h-[33rem] space-y-3 overflow-y-auto p-1">
            <div
              className={cn(
                "grid grid-cols-2 gap-3",
                moreConfig && "grid-cols-4",
              )}
            >
              <FormField
                control={form.control}
                name="agentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>服务器</FormLabel>
                    <FormDescription>中转服务器</FormDescription>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择中转服务器" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {agentOptions?.map((option, index) => (
                          <SelectItem value={option.value} key={index}>
                            {option.label}
                          </SelectItem>
                        ))}
                        {agentOptions?.length === 0 && (
                          <SelectItem value="disabled-option" disabled>
                            暂无可用服务器
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>转发方式</FormLabel>
                    <FormDescription>
                      请选择一种转发方式进行转发
                    </FormDescription>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ForwardMethodOptions.filter(({ value }) => {
                          if (value === ForwardMethod.IPTABLES) {
                            return (
                              String(agentConfig?.AGENT_SUPPORT_DIRECT) ===
                              "true"
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
              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>转发目标</FormLabel>
                    <FormDescription>可以是 IP 或者域名</FormDescription>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>目标端口</FormLabel>
                    <FormDescription>1-65535</FormDescription>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="remark"
                render={({ field }) => (
                  <FormItem
                    className={cn(moreConfig ? "col-span-4" : "col-span-2")}
                  >
                    <FormLabel>备注</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="agentPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>服务器端口</FormLabel>
                    <FormDescription>
                      限制范围 {agentConfig?.AGENT_PORT_RANGE}
                    </FormDescription>
                    <FormControl>
                      <Input {...field} type="number" {...agentPortRange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="more-config"
                onCheckedChange={setMoreConfig}
                checked={moreConfig}
              />
              <Label htmlFor="more-config">更多配置</Label>
            </div>
            {moreConfig && (
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3 flex items-start space-x-6">
                  {/* Proxy Protocol 启用部分 */}
                  <div className="flex-1">
                    <div className="mb-2">
                      <div className="text-sm font-medium">
                        启用 Proxy Protocol
                      </div>
                      <div className="text-sm text-muted-foreground">
                        是否在转发连接时添加Proxy Protocol头
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FormField
                        control={form.control}
                        name="options.proxyProtocol.enabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <Label>{field.value ? "已启用" : "已禁用"}</Label>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Proxy Protocol 版本部分 - 只在启用时显示 */}
                  {form.watch("options.proxyProtocol.enabled") && (
                    <div className="flex-1">
                      <div className="mb-2">
                        <div className="text-sm font-medium">
                          Proxy Protocol 版本
                        </div>
                        <div className="text-sm text-muted-foreground">
                          请选择Proxy Protocol版本
                        </div>
                      </div>
                      <FormField
                        control={form.control}
                        name="options.proxyProtocol.version"
                        render={({ field }) => (
                          <FormItem className="space-y-0">
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
                                <SelectItem value="1">版本 1</SelectItem>
                                <SelectItem value="2">版本 2 (推荐)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* 当转发方式为 realm 且启用 Proxy Protocol 时显示方向选择 */}
                  {form.watch("method") === ForwardMethod.REALM &&
                    form.watch("options.proxyProtocol.enabled") && (
                      <div className="flex-1">
                        <div className="mb-2">
                          <div className="text-sm font-medium">
                            Proxy Protocol 方向
                          </div>
                          <div className="text-sm text-muted-foreground">
                            请选择要启用的方向（发送和接收可以同时选择）
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <FormField
                            control={form.control}
                            name="options.proxyProtocol.send"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <Label>发送</Label>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="options.proxyProtocol.receive"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <Label>接收</Label>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                </div>
                {/*{form.getValues("method") === "GOST" && (*/}
                {/*  <ForwardNewGost form={form} />*/}
                {/*)}*/}
              </div>
            )}
          </form>
        </Form>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => form.reset(defaultValues)}
            disabled={createMutation.isLoading}
          >
            重置
          </Button>
          <Button
            onClick={() => form.handleSubmit(handleSubmit)()}
            loading={createMutation.isLoading}
            success={createMutation.isSuccess}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
