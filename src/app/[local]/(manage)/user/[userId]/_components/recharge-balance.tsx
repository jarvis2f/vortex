import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/lib/ui/dialog";
import { Button } from "~/lib/ui/button";
import { GemIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/lib/ui/tabs";
import { Input } from "~/lib/ui/input";
import { Label } from "~/lib/ui/label";
import { api } from "~/trpc/react";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useTrack } from "~/lib/hooks/use-track";
import { useTranslations } from "use-intl";

const RechargeDepay = dynamic(() => import("./recharge-depay"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full space-y-4">
      <div className="h-8 animate-pulse bg-slate-200"></div>
      <div className="h-8 animate-pulse bg-slate-200"></div>
      <div className="h-8 animate-pulse bg-slate-200"></div>
      <div className="h-[10rem] animate-pulse bg-slate-200"></div>
    </div>
  ),
});

export default function RechargeBalance({ userId }: { userId: string }) {
  const t = useTranslations("user-[userId]-recharge-balance");
  const [code, setCode] = useState("");
  const rechargeBalanceByCodeMutation =
    api.user.rechargeBalanceByCode.useMutation();
  const { track } = useTrack();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <GemIcon className="mr-2 h-5 w-5" />
          {t("recharge")}
        </Button>
      </DialogTrigger>
      <DialogContent className="h-full w-full md:h-auto md:min-w-20">
        <DialogHeader>
          <DialogTitle>{t("balance_recharge")}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="recharge">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recharge">{t("recharge")}</TabsTrigger>
            <TabsTrigger value="recharge_code">
              {t("recharge_code")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value={"recharge"} className="h-[600px]">
            <RechargeDepay />
          </TabsContent>
          <TabsContent value="recharge_code">
            <div className="mb-4">
              <Label>{t("recharge_code")}</Label>
              <div className="mt-1">
                <Input
                  placeholder={t("enter_recharge_code")}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  track("recharge-balance-code-button", {
                    userId: userId,
                    code: code,
                  });
                  void rechargeBalanceByCodeMutation.mutateAsync({
                    id: userId,
                    code: code,
                  });
                }}
                disabled={!code || code === ""}
                loading={rechargeBalanceByCodeMutation.isLoading}
                success={rechargeBalanceByCodeMutation.isSuccess}
              >
                {t("recharge")}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
