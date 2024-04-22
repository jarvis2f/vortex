import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import DePayWidgets from "@depay/widgets";
import { toast } from "~/lib/ui/use-toast";
import { api } from "~/trpc/react";
import { MoneyInput } from "~/lib/ui/money-input";
import { Label } from "~/lib/ui/label";
import { Button } from "~/lib/ui/button";
import { TetherIcon, USDCIcon } from "~/lib/icons";
import { type RouterOutputs } from "~/trpc/shared";
import Image from "next/image";
import Blockchains from "@depay/web3-blockchains";
import { useTrack } from "~/lib/hooks/use-track";
import { useTranslations } from "use-intl";

const dePayWidgetStyles = `
.PoweredByWrapper {
    display: none !important;
}

.ReactDialogAnimation {
    width: 100% !important;
    height: 100% !important;
}

.Dialog {
    width: 100% !important;
    height: 100% !important;
    border-radius: unset !important;
}

.DialogHeader {
    border-radius: unset !important;
}

.ScrollHeightM {
    height: 100% !important;
    max-height: 100% !important;
}
          `;

export default function RechargeDepay() {
  const t = useTranslations("user-[userId]-recharge-depay");
  const dePayRef = useRef(null);
  const [amount, setAmount] = useState("0");
  const [dePay, setDePay] = useState<{
    loaded: boolean;
    unmount?: () => void;
    successful?: boolean;
  }>({
    loaded: false,
  });
  const [payment, setPayment] = useState<RouterOutputs["payment"]["getOne"]>();
  const { refetch } = api.payment.getOne.useQuery(
    { id: payment?.id },
    {
      enabled: !!payment,
      onSuccess: (data) => {
        setPayment(data);
      },
    },
  );
  const createPaymentMutation = api.payment.create.useMutation();
  const { data: dePayIntegrationId } =
    api.system.getDePayIntegrationId.useQuery();
  const { track } = useTrack();
  const { data: config } = api.system.getConfig.useQuery({
    key: "RECHARGE_MIN_AMOUNT",
  });

  const rechargeMinAmount = useMemo(() => {
    return config ? Number(config.RECHARGE_MIN_AMOUNT) : 0;
  }, [config]);

  useEffect(() => {
    if (dePay.successful && payment) {
      void refetch().then(({ data }) => {
        if (data?.status === "SUCCEEDED") {
          track("recharge-depay-success", {
            amount: data.amount,
          });
          toast({
            title: t("recharge_successful"),
            description: `${t("recharge_amount")} ${data.amount} USDC/USDT`,
          });
        } else if (data?.status === "FAILED") {
          track("recharge-depay-fail", {
            amount: data.amount,
          });
          toast({
            title: t("recharge_failed"),
            variant: "destructive",
          });
        }
      });
    }
  }, [dePay.successful]);

  function handleDePayError(error: any) {
    track("recharge-depay-error", {
      error: error.message,
    });
    toast({
      title: "Payment error",
      description: error.message,
      variant: "destructive",
    });
  }

  function createDePayPayment({ payload }: { payload: { paymentId: string } }) {
    if (dePayRef.current === null) {
      return;
    }
    if (dePay.unmount) {
      dePay.unmount();
    }
    track("recharge-depay-create", {
      ...payload,
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const configuration: DePayWidgets.PaymentOptions = {
      title: t("recharge"),
      container: dePayRef.current,
      integration: dePayIntegrationId,
      payload: payload,
      error: handleDePayError,
      critical: handleDePayError,
      amount: {
        currency: "USD",
        fix: parseFloat(amount),
      },
      closed: () => {
        setDePay({
          loaded: false,
          unmount: undefined,
        });
      },
      validated: (successful: boolean) => {
        setDePay((prev) => ({
          ...prev,
          successful: successful,
        }));
      },
      style: {
        colors: {
          primary: "hsl(var(--primary))",
          text: "hsl(var(--primary))",
          buttonText: "hsl(var(--primary-foreground))",
          icons: "hsl(var(--primary))",
        },
        css: dePayWidgetStyles,
      },
    };
    void DePayWidgets.Payment(configuration).then((result) => {
      setDePay({
        loaded: true,
        unmount: result.unmount,
      });
    });
  }

  function createPayment() {
    track("recharge-payment-create-button", {
      amount: amount,
    });
    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber < rechargeMinAmount) {
      toast({
        title: t("invalid_amount"),
        description: `${t("recharge_amount")} ${rechargeMinAmount} USDC/USDT`,
        variant: "destructive",
      });
      return;
    }

    void createPaymentMutation
      .mutateAsync({
        amount: parseFloat(amount),
      })
      .then((result) => {
        setPayment(result);
        createDePayPayment({
          payload: {
            paymentId: result.id,
          },
        });
      });
  }

  return (
    <div className="relative h-full w-full">
      {!dePay.loaded && (
        <>
          <div className="space-y-4">
            <Label>{t("recharge_amount")}</Label>
            <MoneyInput
              value={amount}
              onValueChange={(values) => {
                setAmount(values.value);
              }}
            />
            <Button onClick={() => createPayment()} className="w-full">
              <TetherIcon className="mr-2 h-5 w-5" />
              <USDCIcon className="mr-2 h-5 w-5" />
              {t("confirm")}
            </Button>
          </div>
          <div className="space-y-4">
            <h3 className="mt-4 text-lg font-semibold">{t("notes")}</h3>
            <p className="text-sm">
              1.{" "}
              {t.rich("note_1", {
                important: (children) => <b>{children}</b>,
                rechargeMinAmount: rechargeMinAmount,
              })}
            </p>
            <p className="text-sm">2. {t("note_2")}</p>
            <p className="text-sm">3. {t("note_3")}</p>
            <div>
              <p className="text-md mb-2">{t("supported_networks")}</p>
              <ul className="space-y-2">
                {[
                  Blockchains.avalanche,
                  Blockchains.arbitrum,
                  Blockchains.bsc,
                  Blockchains.polygon,
                  Blockchains.optimism,
                ].map((blockchain) => (
                  <li
                    key={blockchain.id}
                    className="flex items-center space-x-2 rounded bg-muted p-2 text-sm"
                  >
                    <Image
                      src={blockchain.logo}
                      alt={blockchain.name}
                      width={24}
                      height={24}
                      style={{
                        backgroundColor: blockchain.logoBackgroundColor,
                      }}
                    />
                    <span>{blockchain.fullName}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
      <div ref={dePayRef} className="relative h-full" />
      <div className="absolute -bottom-5 right-0 text-xs text-muted-foreground">
        {payment?.id}
      </div>
    </div>
  );
}
