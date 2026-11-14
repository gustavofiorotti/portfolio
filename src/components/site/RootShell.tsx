import type { ReactNode } from "react";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import { themeInitScript } from "@/lib/theme";
import { ToastHost } from "@/components/ui/Toast";
import { Agentation } from "agentation";
import { AnimatedFavicon } from "./AnimatedFavicon";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const interTight = Inter_Tight({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-inter-tight" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

/** <html> and <body> shared by the PT and EN root layouts. */
export async function RootShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  // pass locale and messages explicitly: the static export has no request to infer them from
  const messages = await getMessages({ locale });
  return (
    <html
      lang={locale === "pt" ? "pt-BR" : "en"}
      className={`${inter.variable} ${interTight.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* first thing in <body>: runs before anything is painted */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <ToastHost />
          <AnimatedFavicon />
          {/* visual feedback toolbar for the agent, local dev only */}
          {process.env.NODE_ENV === "development" && <Agentation endpoint="http://localhost:4747" />}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
