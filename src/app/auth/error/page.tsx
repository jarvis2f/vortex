import { type ReactNode } from "react";
import Link from "next/link";

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

export default function AuthErrorPage({
  searchParams: { error = "default" },
}: {
  searchParams: { error: string };
}) {
  const errors: Record<ErrorType, ErrorView> = {
    default: {
      heading: "发生错误",
    },
    configuration: {
      heading: "服务器错误",
      message: (
        <div>
          <p>服务器配置有问题。</p>
          <p>检查服务器日志以获取更多信息。</p>
        </div>
      ),
    },
    accessdenied: {
      heading: "拒绝访问",
      message: (
        <div>
          <p>您没有登录权限。</p>
        </div>
      ),
    },
    verification: {
      heading: "无法登录",
      message: (
        <div>
          <p>登录链接不再有效。</p>
          <p>它可能已经被使用过或者可能已经过期。</p>
        </div>
      ),
    },
    signin: {
      heading: "无法登录",
      message: (
        <div>
          <p>检查您提供的详细信息是否正确。</p>
        </div>
      ),
    },
    oauthsignin: {
      heading: "无法登录",
      message: (
        <div>
          <p>尝试使用其他帐户登录。</p>
        </div>
      ),
    },
    oauthcallback: {
      heading: "无法登录",
      message: (
        <div>
          <p>尝试使用其他帐户登录。</p>
        </div>
      ),
    },
    oauthcreateaccount: {
      heading: "无法登录",
      message: (
        <div>
          <p>尝试使用其他帐户登录。</p>
        </div>
      ),
    },
    emailcreateaccount: {
      heading: "无法登录",
      message: (
        <div>
          <p>尝试使用其他帐户登录。</p>
        </div>
      ),
    },
    callback: {
      heading: "无法登录",
      message: (
        <div>
          <p>尝试使用其他帐户登录。</p>
        </div>
      ),
    },
    oauthaccountnotlinked: {
      heading: "无法登录",
      message: (
        <div>
          <p>要确认您的身份，请使用您最初使用的同一帐户登录。</p>
        </div>
      ),
    },
    emailsignin: {
      heading: "无法登录",
      message: (
        <div>
          <p>电子邮件无法发送。</p>
        </div>
      ),
    },
    credentialssignin: {
      heading: "无法登录",
      message: (
        <div>
          <p>请检查您提供的信息是否正确。</p>
        </div>
      ),
    },
    sessionrequired: {
      heading: "拒绝访问",
      message: (
        <div>
          <p>请登录才能访问此页面。</p>
        </div>
      ),
    },
    userbanned: {
      heading: "用户已禁用",
      message: (
        <div>
          <p>您的帐户已被禁用。</p>
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
          返回登录
        </Link>
      </div>
    </div>
  );
}
