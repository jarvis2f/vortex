import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/lib/ui/dialog";
import { Button } from "~/lib/ui/button";
import { HandCoinsIcon } from "lucide-react";
import { z } from "zod";
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
import { cn } from "~/lib/utils";
import { Textarea } from "~/lib/ui/textarea";
import { api } from "~/trpc/react";
import { useState } from "react";
import { Switch } from "~/lib/ui/switch";
import { Label } from "~/lib/ui/label";
import { MoneyInput } from "~/lib/ui/money-input";
import { type BalanceType } from "@prisma/client";
import { useTrack } from "~/lib/hooks/use-track";

export const updateBalanceFormSchema = z.object({
  amount: z.preprocess(
    (a) => (a ? parseFloat(z.string().parse(a)) : undefined),
    z.number(),
  ),
  extra: z.string().optional(),
});

export default function UpdateBalance({
  userId,
  balanceType,
}: {
  userId: string;
  balanceType?: BalanceType;
}) {
  const [deduct, setDeduct] = useState(false);
  const { track } = useTrack();
  const updateBalanceMutation = api.user.updateBalance.useMutation({});

  function handleSubmit(values: z.infer<typeof updateBalanceFormSchema>) {
    const amount = deduct ? -values.amount : values.amount;
    track("update-balance-button", {
      ...values,
      amount: amount,
      id: userId,
      balanceType,
    });
    void updateBalanceMutation.mutateAsync({
      ...values,
      amount: amount,
      id: userId,
      balanceType,
    });
  }

  const form = useForm<z.infer<typeof updateBalanceFormSchema>>({
    resolver: zodResolver(updateBalanceFormSchema),
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <HandCoinsIcon className="mr-2 h-5 w-5" />
          更新余额
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-20">
        <DialogHeader>
          <DialogTitle>更新余额</DialogTitle>
          <DialogDescription>为用户添加或减少余额</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="max-h-[30rem] space-y-3 overflow-y-auto p-1">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>金额</FormLabel>
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
              name="extra"
              render={({ field }) => (
                <FormItem className={cn("col-span-4")}>
                  <FormLabel>备注</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <div className="flex items-center gap-3">
            <Label htmlFor="deduct">减少余额</Label>
            <Switch id="deduct" onCheckedChange={setDeduct} checked={deduct} />
          </div>
          <Button
            onClick={() => form.handleSubmit(handleSubmit)()}
            loading={updateBalanceMutation.isLoading}
            success={updateBalanceMutation.isSuccess}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
