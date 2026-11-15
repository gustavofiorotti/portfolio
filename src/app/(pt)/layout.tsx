import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/lib/metadata";
import { RootShell } from "@/components/site/RootShell";
import "../globals.css";

export function generateMetadata(): Promise<Metadata> {
  return buildMetadata("pt");
}

export default function PtLayout({ children }: { children: React.ReactNode }) {
  setRequestLocale("pt");
  return <RootShell locale="pt">{children}</RootShell>;
}
