"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const fullLabel = useRef<HTMLSpanElement>(null);
  const shortLabel = useRef<HTMLSpanElement>(null);
  // widths of "Ver currículo" and "Ver", so the label can slide between them (CSS can't animate
  // to auto); measured again once the web font is in
  const [widths, setWidths] = useState<[number, number] | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const a = fullLabel.current?.getBoundingClientRect().width ?? 0;
      const b = shortLabel.current?.getBoundingClientRect().width ?? 0;
      if (a > 0 && b > 0) setWidths([Math.ceil(a), Math.ceil(b)]);
    };
    measure();
    document.fonts?.ready.then(measure);
  }, [t, tHero]);
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

  const savedTimer = useRef(0);
  useEffect(() => () => clearTimeout(savedTimer.current), []);
  const markSaved = () => {
    setSaved(true);
    clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setSaved(false), 2200);
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
      {/* one pill on screen; on touch the first tap morphs it into "Ver | Baixar" and back. Plain
          CSS transitions (resume.css), the same in every engine: the label's width slides between
          the two words while they crossfade, and Baixar's column opens from 0 (0fr → 1fr), so the
          pair stays centred on every frame. (A layout animation snapped on the way back.) */}
      <div className="resume-duo" data-split={split || undefined} data-open={(!split && hover) || undefined}>
        <button
          ref={pill}
          type="button"
          aria-haspopup="dialog"
          onClick={(e) => (!split && isTap(pointer.current, e.detail) ? setSplit(true) : dialog.show())}
          className="btn btn-ghost resume-pill"
        >
          <MorphIcon from={DOC} to={DOC} active={false} size={18} strokeWidth={2} />
          <span className="resume-label" style={widths ? { width: split ? widths[1] : widths[0] } : undefined}>
            <span ref={fullLabel} className="resume-label-text" aria-hidden={split || undefined}>{tHero("seeResume")}</span>
            <span ref={shortLabel} className="resume-label-text" aria-hidden={!split || undefined}>{t("view")}</span>
          </span>
        </button>
        <span className="resume-split-slot" aria-hidden={!split || undefined} inert={!split || undefined}>
          <span className="resume-split-clip">
            <a href={RESUME_URL} download onClick={markSaved} tabIndex={split ? undefined : -1} className="btn btn-ghost resume-pill resume-split-dl">
              <MorphIcon from={DOC} to={saved ? CHECK : DOWNLOAD} active={arrow || saved} size={18} strokeWidth={2} />
              {t("download")}
            </a>
          </span>
        </span>
        {/* mouse only (touch splits the pill instead): waits behind the pill, slides out on hover */}
        <a
          href={RESUME_URL}
          download
          aria-label={t("downloadPdf")}
          title={t("downloadPdf")}
          onClick={markSaved}
          tabIndex={split ? -1 : undefined}
          className="btn btn-ghost resume-download"
        >
          <MorphIcon from={DOC} to={saved ? CHECK : DOWNLOAD} active={hover || saved} size={18} strokeWidth={2} />
        </a>
      </div>
      <ResumeDialog open={dialog.open} onClose={dialog.close} onClosed={onClosed} />
    </div>
  );
}
