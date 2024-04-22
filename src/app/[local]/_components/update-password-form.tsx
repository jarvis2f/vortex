"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/lib/ui/form";
import { Input } from "~/lib/ui/input";
import { Button } from "~/lib/ui/button";
import React, { useMemo } from "react";
import { useTranslations } from "use-intl";

const passwordStrengthRegex =
  /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d^@$!%*#?&]{6,16}$/;

const updatePasswordFormSchema = z
  .object({
    password: z.string().refine((value) => passwordStrengthRegex.test(value), {
      message: "密码必须至少为 6 个字符，并且至少包含 1 个字母和 1 个数字。",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "密码不匹配",
    path: ["confirmPassword"],
  });

export default function UpdatePasswordForm({
  userId,
  type,
}: {
  userId: string;
  type: "setup" | "reset";
}) {
  const t = useTranslations("global_update-password-form");
  const updatePasswordMutation = api.user.updatePassword.useMutation();
  const router = useRouter();

  const formSchema = useMemo(() => {
    if (type === "setup") {
      return updatePasswordFormSchema;
    }
    return updatePasswordFormSchema.and(
      z.object({
        originalPassword: z
          .string()
          .min(1, t("please-enter-your-old-password")),
      }),
    );
  }, [type]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  function handleSubmit(values: z.infer<typeof formSchema>) {
    // @ts-expect-error zodResolver should infer the type
    const { originalPassword, password } = values;
    void updatePasswordMutation
      .mutateAsync({
        id: userId,
        password: password,
        originalPassword: type === "setup" ? undefined : originalPassword,
      })
      .then(() => {
        router.push("/");
      });
  }

  return (
    <div className="grid gap-4 py-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {type === "reset" && (
            <FormField
              control={form.control}
              name="originalPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("old-password")}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      {...field}
                      autoFocus
                      autoComplete="off"
                      autoCorrect="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("password")}</FormLabel>
                <FormControl>
                  <Input
                    id="password"
                    type="password"
                    {...field}
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("confirm-password")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    {...field}
                    autoComplete="off"
                    autoCorrect="off"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              data-umami-event="update-password-button"
              data-umami-event-userId={userId}
              loading={updatePasswordMutation.isLoading}
              success={updatePasswordMutation.isSuccess}
            >
              {t("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
