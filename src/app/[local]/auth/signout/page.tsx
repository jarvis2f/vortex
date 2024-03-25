"use client";
import { Button } from "~/lib/ui/button";
import { signOut } from "next-auth/react";
import { useTranslations } from "use-intl";

export default function SignOutPage() {
  const t = useTranslations("auth-signout");
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">
          {t("confirm_sign_out")}
        </h1>
        <Button
          onClick={() => signOut({ callbackUrl: "/" })}
          data-umami-event="signout-button"
        >
          {t("confirm")}
        </Button>
      </div>
    </div>
  );
}
