import { redirect, RedirectType } from "next/navigation";
import React from "react";
import UpdatePasswordForm from "~/app/[local]/_components/update-password-form";
import { getServerAuthSession } from "~/server/auth";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NewUserPage() {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/auth/signin", RedirectType.replace);
  }

  if (session.user.isSetupPassword) {
    redirect("/", RedirectType.replace);
  }

  const t = await getTranslations("auth-new");

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("create_password")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("create_password_tips")}
        </p>
      </div>
      <UpdatePasswordForm userId={session.user.id} type={"setup"} />
      <Link
        href="/public"
        className="underline underline-offset-4 hover:text-primary"
      >
        {t("skip_password_tips")}
      </Link>
    </div>
  );
}
