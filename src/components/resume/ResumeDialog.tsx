"use client";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { RESUME_URL } from "@/lib/resume";
import pages from "@/lib/resume-pages.json";
import "./resume.css";

const DOWNLOAD = "M12 4 L12 15 M7 10 L12 15 L17 10 M5 20 L19 20";
const OPEN = "M7 17 L17 7 M9 7 L17 7 L17 15";
const CLOSE = "M6 6 L18 18 M18 6 L6 18";

function Icon({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/**
 * Full-screen preview of the whole résumé inside the site, on desktop and phone: pictures of the
 * PDF's pages (an iframe shows only the first page on iOS), with download and "open in a new
 * tab". A native modal <dialog>: the page behind is inert (focus stays inside), Esc closes, and
 * focus goes back to the button that opened it.
 */
export function ResumeDialog({ open, onClose, onClosed }: { open: boolean; onClose: () => void; onClosed?: () => void }) {
  const t = useTranslations("resume");
  const ref = useRef<HTMLDialogElement>(null);
  const closing = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ended = useRef<((e: AnimationEvent) => void) | null>(null);
  const closed = useRef(onClosed);
  const downOnEmpty = useRef(false);
  useEffect(() => {
    closed.current = onClosed;
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const stopClosing = () => {
      if (ended.current) dialog.removeEventListener("animationend", ended.current);
      ended.current = null;
      if (closing.current) clearTimeout(closing.current);
      closing.current = null;
      dialog.removeAttribute("data-closing");
    };
    // the real close, once the closing animation is over: only then can the focus go back to the
    // page (a modal dialog keeps it inside while it is open)
    const finish = () => {
      if (!dialog.hasAttribute("data-closing")) return;
      stopClosing();
      if (dialog.open) dialog.close();
      document.documentElement.classList.remove("resume-open");
      closed.current?.();
    };
    if (open && dialog.hasAttribute("data-closing")) stopClosing(); // opened again mid-close
    if (open && !dialog.open) {
      dialog.showModal();
      // focus the dialog itself (its name is read out): the first link would get it otherwise and
      // look like a choice, and a ring on the X showed up on phones
      dialog.focus();
      // the page behind must not scroll under the preview (iOS scrolls it through the dialog)
      document.documentElement.classList.add("resume-open");
    } else if (!open && dialog.open && !dialog.hasAttribute("data-closing")) {
      // fade out first (resume.css); with less motion, or no animation at all, close at once
      dialog.setAttribute("data-closing", "");
      const anim = getComputedStyle(dialog).animationName;
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (reduce || !anim || anim === "none") finish();
      else {
        // only the dialog's own fade: an animation ending inside it (a page, a button) bubbles up too
        const onEnd = (e: AnimationEvent) => {
          if (e.target !== dialog) return;
          finish();
        };
        ended.current = onEnd;
        dialog.addEventListener("animationend", onEnd);
        closing.current = setTimeout(finish, 400); // in case animationend never comes
      }
    } else if (!open && !dialog.open) {
      document.documentElement.classList.remove("resume-open");
    }
  }, [open]);

  useEffect(() => () => document.documentElement.classList.remove("resume-open"), []);

  const total = pages.pages.length;
  return (
    <dialog
      ref={ref}
      className="resume-dialog"
      tabIndex={-1}
      aria-label={t("dialog")}
      // Esc: close through the same path as the X, so the history entry goes away too
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="resume-bar">
        <span className="resume-title font-display">{t("title")}</span>
        <div className="resume-actions">
          <a href={RESUME_URL} target="_blank" rel="noopener" className="btn btn-ghost resume-action">
            <Icon d={OPEN} />
            {t("openNewTab")}
          </a>
          <a href={RESUME_URL} download className="btn btn-solid resume-action resume-action-solid">
            <Icon d={DOWNLOAD} />
            {t("download")}
          </a>
        </div>
        <button type="button" onClick={onClose} aria-label={t("close")} title={t("close")} className="btn btn-ghost resume-close">
          <Icon d={CLOSE} />
        </button>
      </div>
      {/* the pictures load only once the preview opens; a click or tap on the empty space around the
          pages (not on a page) closes, through the same path as the X so the fade-out plays. Both
          ends of the click must land on that space: a drag that starts on a page (selecting text)
          and ends beside it would otherwise count as a click on the container */}
      <div
        className="resume-pages"
        onPointerDown={(e) => {
          downOnEmpty.current = e.target === e.currentTarget;
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && downOnEmpty.current) onClose();
          downOnEmpty.current = false;
        }}
      >
        {open &&
          pages.pages.map((p, i) => (
            // a static export has no image optimizer: the WebP is already sized for the preview
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.src}
              src={p.src}
              width={p.width}
              height={p.height}
              alt={t("page", { n: i + 1, total })}
              className="resume-page"
              decoding="async"
            />
          ))}
      </div>
    </dialog>
  );
}
