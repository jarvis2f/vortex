"use client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/lib/ui/dialog";
import { Button } from "~/lib/ui/button";
import { z } from "zod";
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
import React, { useContext } from "react";
import { useStore } from "zustand";
import { NetworkContext } from "~/app/[local]/(manage)/network/store/network-store";
import { getNewNodePosition, isValidHost, uuid } from "~/lib/utils";
import { useStoreApi } from "reactflow";

const externalNodeFormSchema = z.object({
  name: z.string({ required_error: "请输入节点名称" }).min(1, "请输入节点名称"),
  host: z
    .string({ required_error: "请输入节点地址" })
    .min(1, "请输入节点地址")
    .refine((v) => isValidHost(v), "请输入正确的地址"),
});

export default function ExternalNodeNew() {
  const { onNodesChange, externalNodeNewOpen, onExternalNodeNewOpen } =
    useStore(useContext(NetworkContext)!);
  const flowStore = useStoreApi();

  const form = useForm<z.infer<typeof externalNodeFormSchema>>({
    resolver: zodResolver(externalNodeFormSchema),
  });

  async function handleSubmit() {
    if (!(await form.trigger())) return;
    const id = uuid();
    const position = getNewNodePosition(flowStore.getState());
    onNodesChange([
      {
        type: "add",
        item: {
          id: id,
          type: "external",
          data: { ...form.getValues(), id },
          position: {
            x: position.x - 48,
            y: position.y - 48,
          },
        },
      },
    ]);
    onExternalNodeNewOpen(false);
  }

  return (
    <Dialog open={externalNodeNewOpen} onOpenChange={onExternalNodeNewOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>创建外部节点</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名称</FormLabel>
                  <FormDescription>
                    请输入外部节点的名称，用于标识该节点
                  </FormDescription>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="host"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>地址</FormLabel>
                  <FormDescription>
                    请输入外部节点的 IP 地址或域名（支持 IPv4/IPv6）
                  </FormDescription>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button onClick={handleSubmit}>创建</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
