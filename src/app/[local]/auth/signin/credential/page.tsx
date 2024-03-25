"use client";
import Link from "next/link";
import React from "react";
import { cn } from "~/lib/utils";
import { Input } from "~/lib/ui/input";
import { Button } from "~/lib/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/lib/ui/form";
import { signIn } from "next-auth/react";
import { useTranslations } from "use-intl";

const credentialSignInFormSchema = z.object({
  username: z.string().email("请输入正确的邮箱地址"),
  password: z.string().min(6, "请输入你的密码"),
});

export default function SigninCredentialPage({
  searchParams: { callbackUrl },
}: {
  searchParams: { callbackUrl: string };
}) {
  const t = useTranslations("auth-signin-credential");
  const form = useForm<z.infer<typeof credentialSignInFormSchema>>({
    resolver: zodResolver(credentialSignInFormSchema),
  });

  function handleSubmit(values: z.infer<typeof credentialSignInFormSchema>) {
    void signIn("credentials", {
      username: values.username,
      password: values.password,
      callbackUrl: callbackUrl || "/",
    });
  }

  return (
    <>
      <Link
        href={
          callbackUrl
            ? `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
            : "/auth/signin"
        }
        className="absolute right-4 top-4 md:right-8 md:top-8"
      >
        {t("back_to_signup")}
      </Link>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("password_signin")}
          </h1>
        </div>
        <div className={cn("grid gap-6")}>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("your_email_address")}
                        type="email"
                        autoCapitalize="none"
                        autoComplete="username"
                        autoCorrect="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("your_password")}
                        type="password"
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                data-umami-event="signin-credential-button"
                data-umami-username={form.getValues("username")}
              >
                {t("signin")}
              </Button>
            </form>
          </Form>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          {t("by_continuing_you_agree_to_our")}{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-primary"
          >
            {t("terms_of_service")}
          </Link>{" "}
          {t("and")}{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-primary"
          >
            {t("privacy_policy")}
          </Link>
        </p>
      </div>
    </>
  );
}
