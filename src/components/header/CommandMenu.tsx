"use client";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { homePath, type Locale } from "@/i18n/locales";
import { CONTACT } from "@/lib/contact";
import { copyText } from "@/lib/copy";
import { smoothScrollTo } from "@/lib/motion-utils";
import { toggleTheme, useTheme } from "@/lib/theme-client";
import { showToast } from "@/components/ui/Toast";
import { RESUME_URL } from "./ResumeButton";
import { SECTION_IDS } from "./sections";

/** ⌘K / Ctrl+K menu: jump to a section, copy the e-mail, download the résumé, switch theme or language. */
export function CommandMenu() {
  const t = useTranslations("cmd");
  const nav = useTranslations("nav");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [open, setOpenState] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  // remember who opened the menu and give focus back to it when it closes (Esc included)
  const setOpen = (next: boolean | ((o: boolean) => boolean)) =>
    setOpenState((o) => {
      const value = typeof next === "function" ? next(o) : next;
      if (value && !o) opener.current = document.activeElement as HTMLElement | null;
      if (!value && o) requestAnimationFrame(() => opener.current?.focus?.());
      return value;
    });
  // read live from html[data-theme], so the label is right however the menu was opened
  const dark = useTheme() === "dark";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };
  const other: Locale = locale === "pt" ? "en" : "pt";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("open")}
        title={t("open")}
        className="btn btn-ghost flex h-11 min-w-11 items-center justify-center rounded-full border border-line px-2.5 font-mono text-xs font-medium text-muted sm:h-9 sm:min-w-0"
      >
        {/* phones get a menu icon (sections live here on small screens); desktops see the shortcut */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="lg:hidden">
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
        <span className="hidden lg:inline">⌘K</span>
      </button>
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label={t("label")}
        overlayClassName="cmd-overlay"
        contentClassName="cmd-content"
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="text-muted">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <Command.Input placeholder={t("placeholder")} className="flex-1 bg-transparent text-base outline-none placeholder:text-muted" />
          <kbd className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px] text-muted">esc</kbd>
        </div>
        <Command.List className="max-h-[360px] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-5 text-sm text-muted">{t("empty")}</Command.Empty>
          {SECTION_IDS.map((id) => (
            <Item key={id} label={t("goTo", { section: nav(id) })} group={t("groups.navigate")} onSelect={run(() => smoothScrollTo(id, 72))} />
          ))}
          <Item
            label={t("copyEmail")}
            group={t("groups.action")}
            onSelect={run(async () => showToast((await copyText(CONTACT.email)) ? t("emailCopied") : CONTACT.email))}
          />
          <Item label={t("downloadResume")} group={t("groups.action")} onSelect={run(() => window.open(RESUME_URL, "_blank", "noopener"))} />
          <Item label={dark ? t("lightOn") : t("lightOff")} group={t("groups.action")} onSelect={run(toggleTheme)} />
          <Item label={t("openGithub")} group={t("groups.link")} onSelect={run(() => window.open(CONTACT.github, "_blank", "noopener"))} />
          <Item label={t("openLinkedin")} group={t("groups.link")} onSelect={run(() => window.open(CONTACT.linkedin, "_blank", "noopener"))} />
          <Item label={t("otherLanguage")} group={t("groups.language")} onSelect={run(() => router.push(homePath(other)))} />
        </Command.List>
        <div className="flex gap-4 border-t border-line px-4 py-2.5 font-mono text-xs text-muted">
          <span>↑↓ {t("hintNavigate")}</span>
          <span>↵ {t("hintOpen")}</span>
          <span>esc {t("hintClose")}</span>
        </div>
      </Command.Dialog>
    </>
  );
}

function Item({ label, group, onSelect }: { label: string; group: string; onSelect: () => void }) {
  return (
    <Command.Item value={label} onSelect={onSelect} className="cmd-item flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-[15px]">
      <span>{label}</span>
      <span className="font-mono text-xs text-muted">{group}</span>
    </Command.Item>
  );
}
