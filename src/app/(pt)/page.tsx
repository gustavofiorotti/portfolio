import { setRequestLocale } from "next-intl/server";
import { HomePage } from "@/components/site/HomePage";

export default function Page() {
  setRequestLocale("pt");
  return <HomePage locale="pt" />;
}
