import { type ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

type ErrorType =
  | "default"
  | "configuration"
  | "accessdenied"
  | "verification"
  | "signin"
  | "oauthsignin"
  | "oauthcallback"
  | "oauthcreateaccount"
  | "emailcreateaccount"
  | "callback"
  | "oauthaccountnotlinked"
  | "emailsignin"
  | "credentialssignin"
  | "sessionrequired"
  | "userbanned";

interface ErrorView {
  heading: string;
  message?: ReactNode;
}

export default async function AuthErrorPage({
  searchParams: { error = "default" },
}: {
  searchParams: { error: string };
}) {
  const t = await getTranslations("auth-error");
  const errors: Record<ErrorType, ErrorView> = {
    default: {
      heading: t("an_error_occurred"),
    },
    configuration: {
      heading: t("server_error"),
      message: (
        <div>
          <p>{t("server_misconfigured")}</p>
          <p>{t("check_server_logs_for_more_info")}</p>
        </div>
      ),
    },
    accessdenied: {
      heading: t("access_denied"),
      message: (
        <div>
          <p>{t("not_authorized_to_signin")}</p>
        </div>
      ),
    },
    verification: {
      heading: t("unable_to_signin"),
      message: (
        <div>
          <p>{t("signin_link_no_longer_valid")}</p>
          <p>{t("it_may_have_been_used_or_expired")}</p>
        </div>
      ),
    },
    signin: {
      heading: t("unable_to_signin"),
      message: (
        <div>
          <p>{t("check_details_provided_are_correct")}</p>
        </div>
      ),
    },
    oauthsignin: {
      heading: t("unable_to_signin"),
      message: (
        <div>
          <p>{t("try_signing_in_with_different_account")}</p>
        </div>
      ),
    },
    oauthcallback: {
      heading: t("unable_to_signin"),
      message: (
        <div>
          <p>{t("try_signing_in_with_different_account")}</p>
        </div>
      ),
    },
    oauthcreateaccount: {
      heading: t("unable_to_signin"),
      message: (
        <div>
          <p>{t("try_signing_in_with_different_account")}</p>
        </div>
      ),
    },
    emailcreateaccount: {
      heading: t("unable_to_signin"),
      message: (
        <div>
          <p>{t("try_signing_in_with_different_account")}</p>
        </div>
      ),
    },
    callback: {
      heading: t("unable_to_signin"),
      message: (
        <div>
          <p>{t("try_signing_in_with_different_account")}</p>
        </div>
      ),
    },
    oauthaccountnotlinked: {
      heading: t("unable_to_signin"),
      message: (
        <div>
          <p>{t("oauth_account_not_linked")}</p>
        </div>
      ),
    },
    emailsignin: {
      heading: t("unable_to_signin"),
      message: (
        <div>
          <p>{t("email_could_not_be_sent")}</p>
        </div>
      ),
    },
    credentialssignin: {
      heading: t("unable_to_signin"),
      message: (
        <div>
          <p>{t("check_information_provided_is_correct")}</p>
        </div>
      ),
    },
    sessionrequired: {
      heading: t("access_denied"),
      message: (
        <div>
          <p>{t("please_signin_to_access_this_page")}</p>
        </div>
      ),
    },
    userbanned: {
      heading: t("user_disabled"),
      message: (
        <div>
          <p>{t("your_account_has_been_disabled")}</p>
        </div>
      ),
    },
  };

  const { heading, message } =
    errors[error.toLowerCase() as ErrorType] ?? errors.default;

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
        <div className="text-sm text-muted-foreground">{message}</div>
        <Link href="/auth/signin" className="underline">
          {t("back_to_signin")}
        </Link>
      </div>
    </div>
  );
}
