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
import { useTranslations } from "use-intl";

export const withdrawalBalanceFormSchema = z.object({
  amount: z.preprocess(
    (a) => (a ? parseFloat(z.string().parse(a)) : undefined),
    z.number(),
  ),
  address: z.string().min(1).max(100),
});

export default function WithdrawalBalance({ balance }: { balance: string }) {
  const t = useTranslations("user-[userId]-withdrawal-balance");
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
          {t("request_withdrawal")}
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-20">
        <DialogHeader>
          <DialogTitle>{t("withdrawal")}</DialogTitle>
          <DialogDescription className="space-y-1">
            <p>{t("request_withdrawal_desc")}</p>
            <p>
              {t("current_earnings_balance")}：${balance}
            </p>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="max-h-[30rem] space-y-3 overflow-y-auto p-1">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("amount")}</FormLabel>
                  <FormDescription>
                    {t("minimum_withdrawal_amount")} ${withdrawMinAmount}
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
                  <FormLabel>{t("receiving_address")}</FormLabel>
                  <FormDescription>
                    {t("please_provide")} USDC {t("receiving_address")}
                  </FormDescription>
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
            {t("request_withdrawal")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
