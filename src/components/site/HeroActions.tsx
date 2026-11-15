"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { smoothScrollTo } from "@/lib/motion-utils";
import { RESUME_URL } from "@/lib/resume";
import { MorphIcon } from "@/components/ui/MorphIcon";

// document → ↗ (opens the PDF), and the download arrow → ✓ after the click
const DOC = "M14 3 L7 3 C5.9 3 5 3.9 5 5 L5 19 C5 20.1 5.9 21 7 21 L17 21 C18.1 21 19 20.1 19 19 L19 8 L14 3 M14 3 L14 8 L19 8";
const OPEN = "M7 17 L7 17 C7 17 7 17 7 17 L12 12 C12 12 12 12 12 12 L17 7 C17 7 17 7 17 7 L17 7 L17 7 M9 7 L17 7 L17 15";
const DOWNLOAD = "M12 4 L12 15 M7 10 L12 15 L17 10 M5 20 L19 20";
const CHECK = "M10 18 L10 18 M5 13 L10 18 L19 7 M10 18 L10 18";

export function HeroActions() {
  const t = useTranslations("hero");
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
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
      {/* "see" pill; the round download button slides out from behind it (always shown on touch) */}
      <div
        className="resume-duo flex items-center"
        onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
        onPointerLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setOpen(false)}
      >
        <a
          href={RESUME_URL}
          target="_blank"
          rel="noopener"
          className="btn btn-ghost resume-main relative z-[1] flex h-13 items-center gap-2.5 rounded-full border border-line bg-bg px-6.5 text-base font-medium"
        >
          <MorphIcon from={DOC} to={OPEN} active={open} size={18} strokeWidth={2} />
          {t("seeResume")}
        </a>
        <a
          href={RESUME_URL}
          download
          aria-label={t("downloadResume")}
          title={t("downloadResume")}
          onClick={() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2200);
          }}
          className="btn btn-ghost resume-download grid size-13 place-items-center rounded-full border border-line"
        >
          <MorphIcon from={DOWNLOAD} to={CHECK} active={saved} size={18} strokeWidth={2} />
        </a>
      </div>
    </div>
  );
}
