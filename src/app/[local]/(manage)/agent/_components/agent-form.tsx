"use client";
import { Button } from "~/lib/ui/button";
import { Input } from "~/lib/ui/input";
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
import { api } from "~/trpc/react";
import { type Agent } from ".prisma/client";
import { Switch } from "~/lib/ui/switch";
import { useRouter } from "next/navigation";

const agentFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  isShared: z.boolean().optional(),
});

export function AgentForm({ agent }: { agent?: Agent }) {
  const edit = !!agent;
  const router = useRouter();

  const form = useForm<z.infer<typeof agentFormSchema>>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: agent?.name ?? "",
      description: agent?.description ?? "",
      isShared: agent?.isShared ?? false,
    },
  });

  const createAgent = api.agent.create.useMutation({
    onSuccess: () => {
      router.refresh();
    },
  });
  const updateAgent = api.agent.update.useMutation({
    onSuccess: () => {
      router.refresh();
    },
  });

  function handleSubmit(values: z.infer<typeof agentFormSchema>) {
    if (edit) {
      void updateAgent.mutateAsync({
        id: agent?.id,
        ...values,
      });
    } else {
      void createAgent.mutateAsync({ ...values });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="grid space-y-4 py-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>名称</FormLabel>
                <FormDescription>
                  服务器名称，用于区分不同服务器。
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>描述</FormLabel>
                <FormDescription>服务器描述</FormDescription>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {edit && (
            <FormField
              control={form.control}
              name="isShared"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>共享</FormLabel>
                  <FormDescription>是否共享给其他用户</FormDescription>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <div className="flex justify-end">
            <Button
              type="submit"
              success={edit ? updateAgent.isSuccess : createAgent.isSuccess}
              loading={edit ? updateAgent.isLoading : createAgent.isLoading}
            >
              保存
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
