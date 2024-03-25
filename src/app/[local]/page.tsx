import { getServerAuthSession } from "~/server/auth";
import Logo from "~/app/[local]/_components/logo";
import Welcome from "~/app/[local]/_components/welcome";
import Link from "next/link";
import LocaleSwitcher from "~/app/[local]/_components/locale-switcher";
import { getTranslations } from "next-intl/server";
import { ThemeChange } from "~/app/[local]/_components/theme-provider";

export default async function Home() {
  const session = await getServerAuthSession();
  const t = await getTranslations("index");

  return (
    <main className="relative flex h-screen w-full items-center justify-center p-4">
      <Logo className="absolute left-6 top-6" />
      <Welcome className="-z-10 h-screen w-screen" welcome={t("Welcome")} />
      <div className="absolute right-6 top-6 flex items-center space-x-3">
        <ThemeChange />
        <LocaleSwitcher />
        {session ? (
          <Link href="/dashboard" className="text-2xl">
            {t("Dashboard")}
          </Link>
        ) : (
          <Link href="/auth/signin" className="text-2xl">
            {t("Sign In")}
          </Link>
        )}
      </div>
    </main>
  );
}
