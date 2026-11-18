"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { RESUME_URL } from "@/lib/resume";
import { MorphIcon } from "@/components/ui/MorphIcon";
import { ResumeDialog } from "./ResumeDialog";
import { useResumeDialog } from "./use-resume-dialog";
import "./resume.css";

// eye (see) ↔ download arrow: same commands, so the morph interpolates the numbers. The eye's
// outline becomes the arrow's base line, its pupil the shaft and head drawn in one stroke.
export const EYE =
  "M2 12 C5 6 19 6 22 12 C19 18 5 18 2 12 M12 9.5 C13.4 9.5 14.5 10.6 14.5 12 C14.5 13.4 13.4 14.5 12 14.5 C10.6 14.5 9.5 13.4 9.5 12 C9.5 10.6 10.6 9.5 12 9.5";
export const ARROW =
  "M5 20 C9.7 20 14.3 20 19 20 C14.3 20 9.7 20 5 20 M12 4 C12 7.7 12 11.3 12 15 C10.3 13.3 8.7 11.7 7 10 C8.7 11.7 10.3 13.3 12 15 C13.7 13.3 15.3 11.7 17 10";
// ✓ with the same commands, for after a download from the icon
export const CHECK_C =
  "M10 18 C10 18 10 18 10 18 C10 18 10 18 10 18 M5 13 C6.7 14.7 8.3 16.3 10 18 C13 14.3 16 10.7 19 7 C19 7 19 7 19 7 C19 7 19 7 19 7";
const DOWNLOAD = "M12 4 L12 15 M7 10 L12 15 L17 10 M5 20 L19 20";
const CHECK = "M10 18 L10 18 M5 13 L10 18 L19 7 M10 18 L10 18";
const SPLIT_MS = 5000;

/** A tap (not a click from the mouse or the keyboard, whose clicks have detail 0). */
const isTap = (type: string, detail: number) => detail > 0 && (type === "touch" || type === "pen");

/**
 * "Ver currículo": opens the full preview inside the site. To download straight away: with a
 * mouse, the icon on the left turns from an eye into a download arrow on hover and downloads on
 * click; on touch, the first tap splits the pill into "Ver | Baixar" (closes again after 5 s).
 */
export function ResumeButton() {
  const t = useTranslations("resume");
  const tHero = useTranslations("hero");
  const dialog = useResumeDialog();
  const [hover, setHover] = useState(false);
  const [split, setSplit] = useState(false);
  const [saved, setSaved] = useState(false);
  const pointer = useRef("mouse");
  const root = useRef<HTMLDivElement>(null);

  // the split pill folds back after a while, or on a tap anywhere else
  useEffect(() => {
    if (!split) return;
    const timer = setTimeout(() => setSplit(false), SPLIT_MS);
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setSplit(false);
    addEventListener("pointerdown", away);
    return () => {
      clearTimeout(timer);
      removeEventListener("pointerdown", away);
    };
  }, [split]);

  const markSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div
      ref={root}
      className="resume-wrap"
      onPointerDown={(e) => (pointer.current = e.pointerType)}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      {split ? (
        <div className="resume-split">
          <button type="button" onClick={dialog.show} aria-haspopup="dialog" className="btn btn-ghost resume-half">
            <MorphIcon from={EYE} to={EYE} active={false} size={18} strokeWidth={2} />
            {t("view")}
          </button>
          <a href={RESUME_URL} download onClick={markSaved} className="btn btn-ghost resume-half" style={{ animationDelay: "40ms" }}>
            <MorphIcon from={DOWNLOAD} to={CHECK} active={saved} size={18} strokeWidth={2} />
            {t("download")}
          </a>
        </div>
      ) : (
        <div className="btn btn-ghost resume-pill" data-hover={hover || undefined}>
          {/* the icon is its own target: with a mouse it downloads, a tap only splits the pill */}
          <a
            href={RESUME_URL}
            download
            aria-label={t("downloadPdf")}
            title={t("downloadPdf")}
            onFocus={() => setHover(true)}
            onBlur={() => setHover(false)}
            onClick={(e) => {
              if (isTap(pointer.current, e.detail)) {
                e.preventDefault();
                setSplit(true);
              } else markSaved();
            }}
            className="resume-icon"
          >
            <MorphIcon from={EYE} to={saved ? CHECK_C : ARROW} active={hover || saved} size={18} strokeWidth={2} />
          </a>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={(e) => (isTap(pointer.current, e.detail) ? setSplit(true) : dialog.show())}
            className="resume-view"
          >
            {tHero("seeResume")}
          </button>
        </div>
      )}
      <ResumeDialog open={dialog.open} onClose={dialog.close} />
    </div>
  );
}
