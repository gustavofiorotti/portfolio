import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RootShell } from "@/components/site/RootShell";
import "../globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "pt", namespace: "meta" });
  return { title: t("title"), description: t("description"), alternates: { languages: { en: "/en" } } };
}

export default function PtLayout({ children }: { children: React.ReactNode }) {
  setRequestLocale("pt");
  return <RootShell locale="pt">{children}</RootShell>;
}
