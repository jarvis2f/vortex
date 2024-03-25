import React, { type ReactNode } from "react";
import Logo from "~/app/[local]/_components/logo";
import LocaleSwitcher from "~/app/[local]/_components/locale-switcher";
import { ThemeChange } from "~/app/[local]/_components/theme-provider";

export default function SigninLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="container relative grid h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-zinc-900" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <Logo />
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &ldquo;This library has saved me countless hours of work and
                helped me deliver stunning designs to my clients faster than
                ever before.&rdquo;
              </p>
              <footer className="text-sm">Sofia Davis</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          {children}
          <div className="absolute bottom-4 right-4">
            <ThemeChange />
            <LocaleSwitcher />
          </div>
        </div>
      </div>
    </>
  );
}
