import { getCsrfToken, getProviders } from "next-auth/react";
import { Input } from "~/lib/ui/input";
import { Button } from "~/lib/ui/button";
import { Label } from "~/lib/ui/label";
import React from "react";
import Link from "next/link";
import { cn } from "~/lib/utils";
import { GithubIcon } from "lucide-react";
import { GoogleIcon } from "~/lib/icons";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RedirectType } from "next/dist/client/components/redirect";
import { api } from "~/trpc/server";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

export default async function SigninPage({
  searchParams: { error, callbackUrl },
}: {
  searchParams: { error: string; callbackUrl: string };
}) {
  if (error) {
    redirect(`/auth/error?error=${error}`, RedirectType.replace);
  }
  const t = await getTranslations("auth-signin");
  const { ENABLE_REGISTER } = await api.publicSystem.getConfig.query({
    key: "ENABLE_REGISTER",
  });

  const PasswordSignIn = () => (
    <Link
      href={
        callbackUrl
          ? `/auth/signin/credential?callbackUrl=${encodeURIComponent(
              callbackUrl,
            )}`
          : "/auth/signin/credential"
      }
      className="absolute right-4 top-4 md:right-8 md:top-8"
    >
      {t("password_signin")}
    </Link>
  );

  if (!ENABLE_REGISTER) {
    return (
      <>
        <PasswordSignIn />
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Image
            className="m-auto"
            src="/3d-fluency-face-screaming-in-fear.png"
            alt="face-screaming-in-fear"
            width={200}
            height={200}
          />
          <h1 className="text-center text-2xl font-semibold tracking-tight">
            {t("registration_closed")}！
          </h1>
        </div>
      </>
    );
  }

  const providers = await getProviders();
  const csrfToken = await getCsrfToken({
    req: {
      headers: {
        cookie: cookies().toString(),
      },
    },
  });

  const EmailSignIn = () => {
    if (!providers?.email) return null;
    const provider = providers.email;
    return (
      <form action={provider.signinUrl} method="POST">
        <input type="hidden" name="csrfToken" value={csrfToken} />
        {callbackUrl && (
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
        )}
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
              name={"email"}
              id="email"
              placeholder={t("your_email_address")}
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
            />
          </div>
          <Button type="submit" data-umami-event="signin-email-button">
            {t("continue")}
          </Button>
        </div>
      </form>
    );
  };

  const OAuthSignIn = () => {
    if (!providers) return null;
    return Object.values(providers).map((provider) => {
      if (provider.type !== "oauth") return null;

      return (
        <form action={provider.signinUrl} method="POST" key={provider.id}>
          <input type="hidden" name="csrfToken" value={csrfToken} />
          {callbackUrl && (
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
          )}
          <Button
            variant="outline"
            type="submit"
            className="w-full"
            data-umami-event={`signin-${provider.id}-button`}
          >
            {provider.id === "github" && (
              <GithubIcon className="mr-2 h-4 w-4" />
            )}
            {provider.id === "google" && (
              <GoogleIcon className="mr-2 h-4 w-4" />
            )}
            {provider.name} {t("signin")}
          </Button>
        </form>
      );
    });
  };

  return (
    <>
      <PasswordSignIn />
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("create_an_account")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("enter_email_signin_or_register")}
          </p>
        </div>
        <div className={cn("grid gap-6")}>
          <EmailSignIn />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t("or_use")}
              </span>
            </div>
          </div>
          <OAuthSignIn />
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
