import "~/styles/globals.css";

import { Inter } from "next/font/google";
import { cookies } from "next/headers";

import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/app/[local]/_components/theme-provider";
import { Toaster } from "~/lib/ui/toaster";
import Script from "next/script";
import { env } from "~/env";
import { type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, unstable_setRequestLocale } from "next-intl/server";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "vortex",
  description: "A network forwarder",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body className={`font-sans ${inter.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            <TRPCReactProvider cookies={cookies().toString()}>
              {children}
            </TRPCReactProvider>
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
      {env.NEXT_PUBLIC_UMAMI && env.NEXT_PUBLIC_UMAMI_ID && (
        <Script
          defer
          src={env.NEXT_PUBLIC_UMAMI}
          data-website-id={env.NEXT_PUBLIC_UMAMI_ID}
          data-auto-track={process.env.NODE_ENV === "production"}
        />
      )}
    </html>
  );
}
