"use client";
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
import MarkdownInput from "~/app/[local]/(manage)/ticket/_components/markdown-input";
import { Button } from "~/lib/ui/button";
import { useTrack } from "~/lib/hooks/use-track";
import { api } from "~/trpc/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

const createTicketFormSchema = z.object({
  title: z.string().min(1).max(50),
  content: z.string().min(1).max(10000),
});

export default function NewTicketForm() {
  const { track } = useTrack();
  const router = useRouter();
  const createTicketMutation = api.ticket.create.useMutation();
  const form = useForm<z.infer<typeof createTicketFormSchema>>({
    resolver: zodResolver(createTicketFormSchema),
  });

  function handleSubmit(values: z.infer<typeof createTicketFormSchema>) {
    track("ticket-create-button", {
      ...values,
    });
    void createTicketMutation
      .mutateAsync({
        ...values,
      })
      .then((ticket) => {
        router.push(`/ticket/${ticket.id}`);
      });
  }

  return (
    <div className="grid gap-4 py-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>标题</FormLabel>
                <FormDescription>请简要描述您的问题</FormDescription>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>内容</FormLabel>
                <FormDescription>
                  支持 Markdown 格式，最大长度 10000 字符
                </FormDescription>
                <FormControl>
                  <MarkdownInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              loading={createTicketMutation.isLoading}
              success={createTicketMutation.isSuccess}
            >
              保存
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
