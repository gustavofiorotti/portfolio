import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/lib/metadata";
import { RootShell } from "@/components/site/RootShell";
import "../../globals.css";

export function generateMetadata(): Promise<Metadata> {
  return buildMetadata("en");
}

export default function EnLayout({ children }: { children: React.ReactNode }) {
  setRequestLocale("en");
  return <RootShell locale="en">{children}</RootShell>;
}
