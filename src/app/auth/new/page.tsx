import { redirect, RedirectType } from "next/navigation";
import React from "react";
import UpdatePasswordForm from "~/app/_components/update-password-form";
import { getServerAuthSession } from "~/server/auth";
import Link from "next/link";

export default async function NewUserPage() {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/auth/signin", RedirectType.replace);
  }

  if (session.user.isSetupPassword) {
    redirect("/", RedirectType.replace);
  }

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">创建密码</h1>
        <p className="text-sm text-muted-foreground">
          为您的账户创建一个密码，以便您可以使用电子邮件地址和密码登录。
        </p>
      </div>
      <UpdatePasswordForm userId={session.user.id} type={"setup"} />
      <Link
        href="/"
        className="underline underline-offset-4 hover:text-primary"
      >
        不设置密码，直接登录
      </Link>
    </div>
  );
}
