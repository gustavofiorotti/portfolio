"use client";
import { useTranslations } from "next-intl";
import { smoothScrollTo } from "@/lib/motion-utils";
import { RESUME_URL } from "@/components/header/ResumeButton";

export function HeroActions() {
  const t = useTranslations("hero");
  return (
    <div className="flex flex-wrap justify-center gap-3">
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
      <a
        href={RESUME_URL}
        target="_blank"
        rel="noopener"
        className="btn btn-ghost flex h-13 items-center gap-2.5 rounded-full border border-line px-6.5 text-base font-medium"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
        </svg>
        {t("seeResume")}
      </a>
    </div>
  );
}
