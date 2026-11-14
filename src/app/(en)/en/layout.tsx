import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RootShell } from "@/components/site/RootShell";
import "../../globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "en", namespace: "meta" });
  return { title: t("title"), description: t("description"), alternates: { languages: { "pt-BR": "/" } } };
}

export default function EnLayout({ children }: { children: React.ReactNode }) {
  setRequestLocale("en");
  return <RootShell locale="en">{children}</RootShell>;
}
