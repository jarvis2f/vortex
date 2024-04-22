"use client";

import { z } from "zod";
import { api } from "~/trpc/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/lib/ui/form";
import { Input } from "~/lib/ui/input";
import { Button } from "~/lib/ui/button";
import { useEffect, useState } from "react";
import { type RouterOutputs } from "~/trpc/shared";
import { useTrack } from "~/lib/hooks/use-track";
import { useTranslations } from "use-intl";

const updateProfileFormSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  image: z.string().optional(),
});

export default function ProfileForm({
  user,
}: {
  user: RouterOutputs["user"]["getOne"];
}) {
  const t = useTranslations("user-[userId]-profile-form");
  const updateProfileMutation = api.user.updateProfile.useMutation();
  const { track } = useTrack();
  const form = useForm<z.infer<typeof updateProfileFormSchema>>({
    resolver: zodResolver(updateProfileFormSchema),
    defaultValues: {
      name: user?.name ?? "",
      image: user?.image ?? "",
    },
  });
  const [submitDisabled, setSubmitDisabled] = useState(true);
  useEffect(() => {
    if (
      form.getValues("name") === (user?.name ?? "") &&
      form.getValues("image") === (user?.image ?? "")
    ) {
      setSubmitDisabled(true);
    } else {
      setSubmitDisabled(false);
    }
  }, [form.getValues("name"), form.getValues("image")]);

  function handleSubmit(values: z.infer<typeof updateProfileFormSchema>) {
    track("user-profile-update-button", {
      ...values,
    });
    void updateProfileMutation.mutateAsync({
      ...values,
    });
  }

  return (
    <div className="grid gap-4 py-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("name")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  {t("name_displayed_in_profile")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("avatar")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>{t("avatar_link")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={submitDisabled}
              loading={updateProfileMutation.isLoading}
              success={updateProfileMutation.isSuccess}
            >
              {t("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
