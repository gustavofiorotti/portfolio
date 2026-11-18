"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { RESUME_URL } from "@/lib/resume";
import { MorphIcon } from "@/components/ui/MorphIcon";
import { ResumeDialog } from "./ResumeDialog";
import { useResumeDialog } from "./use-resume-dialog";
import "./resume.css";

// document → download arrow → ✓, all with the same commands so the morph interpolates numbers:
// the page outline folds into the shaft and head (one stroke), the corner fold into the base line
export const DOC = "M14 3 L7 3 C5.9 3 5 3.9 5 5 L5 19 C5 20.1 5.9 21 7 21 L17 21 C18.1 21 19 20.1 19 19 L19 8 L14 3 M14 3 L14 8 L19 8";
export const DOWNLOAD = "M12 4 L12 15 C12 15 12 15 12 15 L7 10 C7 10 7 10 7 10 L12 15 C12 15 12 15 12 15 L17 10 L17 10 M5 20 L12 20 L19 20";
export const CHECK = "M5 13 L10 18 C10 18 10 18 10 18 L19 7 C19 7 19 7 19 7 L19 7 C19 7 19 7 19 7 L19 7 L19 7 M10 18 L10 18 L10 18";
const SPLIT_MS = 5000;
const SPRING = { type: "spring", stiffness: 420, damping: 34, mass: 0.8 } as const;

/** A tap (not a click from the mouse or the keyboard, whose clicks have detail 0). */
const isTap = (type: string, detail: number) => detail > 0 && (type === "touch" || type === "pen");

/**
 * "Ver currículo": opens the full preview inside the site. To download straight away: with a
 * mouse, a round button slides out from the side of the pill on hover, its document icon turning
 * into a download arrow; on touch, the first tap splits the pill into "Ver | Baixar" (closes
 * again after 5 s).
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
  const pill = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();
  // the Baixar half's icon turns from the document into the arrow as it comes out
  const [arrow, setArrow] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setArrow(split));
    return () => cancelAnimationFrame(id);
  }, [split]);

  // once the preview has really closed (after its fade), fold the split pill and give the focus
  // back to "Ver currículo" (Safari never focused the button on click, so nothing else would)
  const onClosed = () => {
    setSplit(false);
    pill.current?.focus({ preventScroll: true });
  };

  // the split pill folds back after a while, or on a tap anywhere else; never under the preview
  useEffect(() => {
    if (!split || dialog.open) return;
    const timer = setTimeout(() => setSplit(false), SPLIT_MS);
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setSplit(false);
    addEventListener("pointerdown", away);
    return () => {
      clearTimeout(timer);
      removeEventListener("pointerdown", away);
    };
  }, [split, dialog.open]);

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
      // keyboard focus only: a mouse click focuses the pill too (outside Safari), and the side
      // button would then stay out after the pointer left
      onFocus={(e) => e.target.matches(":focus-visible") && setHover(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setHover(false)}
    >
      {/* one pill on screen; on touch the first tap morphs it into "Ver | Baixar": the same button
          shrinks into "Ver" while "Baixar" grows out of its side (layout animation, Motion) */}
      <LayoutGroup>
        <div className={split ? "resume-duo is-split" : "resume-duo"} data-open={(!split && hover) || undefined}>
          <motion.button
            ref={pill}
            layout={!reduce}
            transition={SPRING}
            type="button"
            aria-haspopup="dialog"
            onClick={(e) => (!split && isTap(pointer.current, e.detail) ? setSplit(true) : dialog.show())}
            className={split ? "btn btn-ghost resume-pill resume-half" : "btn btn-ghost resume-pill"}
            style={{ borderRadius: 999 }}
          >
            <motion.span layout={reduce ? false : "position"} transition={SPRING} className="resume-pill-icon">
              <MorphIcon from={DOC} to={DOC} active={false} size={18} strokeWidth={2} />
            </motion.span>
            <motion.span layout={reduce ? false : "position"} transition={SPRING}>
              {split ? t("view") : tHero("seeResume")}
            </motion.span>
          </motion.button>
          <AnimatePresence initial={false}>
            {split && (
              <motion.a
                key="baixar"
                href={RESUME_URL}
                download
                onClick={markSaved}
                className="btn btn-ghost resume-half"
                style={{ borderRadius: 999 }}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, x: -56, scale: 0.6 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, x: -56, scale: 0.6, transition: { duration: 0.18 } }}
                transition={SPRING}
              >
                <MorphIcon from={DOC} to={saved ? CHECK : DOWNLOAD} active={arrow || saved} size={18} strokeWidth={2} />
                {t("download")}
              </motion.a>
            )}
          </AnimatePresence>
          {/* mouse only (touch splits the pill instead): waits behind the pill, slides out on hover */}
          {!split && (
            <a
              href={RESUME_URL}
              download
              aria-label={t("downloadPdf")}
              title={t("downloadPdf")}
              onClick={markSaved}
              className="btn btn-ghost resume-download"
            >
              <MorphIcon from={DOC} to={saved ? CHECK : DOWNLOAD} active={hover || saved} size={18} strokeWidth={2} />
            </a>
          )}
        </div>
      </LayoutGroup>
      <ResumeDialog open={dialog.open} onClose={dialog.close} onClosed={onClosed} />
    </div>
  );
}
