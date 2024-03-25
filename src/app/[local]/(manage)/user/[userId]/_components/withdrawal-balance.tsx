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
import { CircleDollarSignIcon } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/lib/ui/form";
import { MoneyInput } from "~/lib/ui/money-input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "~/lib/ui/input";
import { api } from "~/trpc/react";
import { useForm } from "react-hook-form";
import { useMemo } from "react";
import { useTrack } from "~/lib/hooks/use-track";

export const withdrawalBalanceFormSchema = z.object({
  amount: z.preprocess(
    (a) => (a ? parseFloat(z.string().parse(a)) : undefined),
    z.number(),
  ),
  address: z.string().min(1).max(100),
});

export default function WithdrawalBalance({ balance }: { balance: string }) {
  const createWithdrawalMutation = api.withdrawal.create.useMutation({});
  const { data: config } = api.system.getConfig.useQuery({
    key: "WITHDRAW_MIN_AMOUNT",
  });
  const { track } = useTrack();

  const withdrawMinAmount = useMemo(() => {
    return config ? Number(config.WITHDRAW_MIN_AMOUNT) : 0;
  }, [config]);

  function handleSubmit(values: z.infer<typeof withdrawalBalanceFormSchema>) {
    track("withdrawal-balance-submit-button", {
      ...values,
    });
    void createWithdrawalMutation.mutateAsync({
      ...values,
    });
  }

  const form = useForm<z.infer<typeof withdrawalBalanceFormSchema>>({
    resolver: zodResolver(withdrawalBalanceFormSchema),
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <CircleDollarSignIcon className="mr-2 h-5 w-5" />
          申请提现
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-20">
        <DialogHeader>
          <DialogTitle>提现</DialogTitle>
          <DialogDescription className="space-y-1">
            <p>申请提现到指定的地址，需要扣除部分手续费，以实际到账金额为准</p>
            <p>当前收益余额：${balance}</p>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="max-h-[30rem] space-y-3 overflow-y-auto p-1">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>金额</FormLabel>
                  <FormDescription>
                    最低提现金额为 ${withdrawMinAmount}
                  </FormDescription>
                  <FormControl>
                    <MoneyInput
                      disabled={
                        process.env.NODE_ENV === "production" &&
                        Number(balance) < withdrawMinAmount
                      }
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>收款地址</FormLabel>
                  <FormDescription>请提供 USDC 收款地址</FormDescription>
                  <FormControl>
                    <Input {...field} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            disabled={
              process.env.NODE_ENV === "production" &&
              form.getValues("amount") < withdrawMinAmount
            }
            onClick={() => form.handleSubmit(handleSubmit)()}
            loading={createWithdrawalMutation.isLoading}
            success={createWithdrawalMutation.isSuccess}
          >
            申请提现
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
