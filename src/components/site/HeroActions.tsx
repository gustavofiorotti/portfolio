"use client";
import { useTranslations } from "next-intl";
import { smoothScrollTo } from "@/lib/motion-utils";
import { ResumeButton } from "@/components/resume/ResumeButton";

export function HeroActions() {
  const t = useTranslations("hero");
  // phones: "Ver currículo" goes under "Ver projetos", both centered
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
      <a
        href="#projetos"
        onClick={(e) => {
          e.preventDefault();
          smoothScrollTo("projetos", 72);
        }}
        className="btn btn-solid flex h-13 items-center rounded-full bg-fg px-6.5 text-base font-medium text-bg"
      >
        {t("seeProjects")}
      </a>
      <ResumeButton />
    </div>
  );
}
