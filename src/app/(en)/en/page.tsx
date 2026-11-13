import { setRequestLocale } from "next-intl/server";
import { HomePage } from "@/components/site/HomePage";

export default function Page() {
  setRequestLocale("en");
  return <HomePage locale="en" />;
}
