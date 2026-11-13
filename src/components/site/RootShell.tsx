import type { ReactNode } from "react";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import { themeInitScript } from "@/lib/theme";

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
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
