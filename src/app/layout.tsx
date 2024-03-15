import "~/styles/globals.css";

import { Inter } from "next/font/google";
import { cookies } from "next/headers";

import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/app/_components/theme-provider";
import { Toaster } from "~/lib/ui/toaster";
import Script from "next/script";
import { env } from "~/env";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "vortex",
  description: "A network forwarder",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`font-sans ${inter.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCReactProvider cookies={cookies().toString()}>
            {children}
          </TRPCReactProvider>
          <Toaster />
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
