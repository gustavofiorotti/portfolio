"use client";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { homePath, type Locale } from "@/i18n/locales";
import { CONTACT, SOCIAL_LINKS, type SocialId } from "@/lib/contact";
import { copyText } from "@/lib/copy";
import { smoothScrollTo } from "@/lib/motion-utils";
import { toggleTheme, useTheme } from "@/lib/theme-client";
import { showToast } from "@/components/ui/Toast";
import { RESUME_URL, RESUME_VIEW_URL } from "@/lib/resume";
import { projectLinks } from "@/lib/command-items";
import { projects } from "@/lib/projects";
import { siteUrl } from "@/lib/site";
import { clientShortcutLabel } from "@/lib/shortcut";
import { SECTION_IDS } from "./sections";

// the portfolio's "live" link is this very site (a redirect back here), so only its code is listed
const PROJECT_LINKS = projectLinks(projects).filter((l) => l.key !== "portfolio-online");
// the networks come from the dock's list; only their labels live here
const SOCIAL_LABEL = { linkedin: "openLinkedin", x: "openX", github: "openGithub", instagram: "openInstagram" } as const satisfies Record<SocialId, string>;
const openTab = (href: string) => window.open(href, "_blank", "noopener");

/** ⌘K / Ctrl+K menu: sections, project links, e-mail and site link, résumé, theme, socials and language. */
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
  // ⌘K on Apple devices, Ctrl K elsewhere, nothing on phones (no keyboard to talk about)
  // undefined until hydrated: the static HTML cannot know the visitor's OS, and a "⌘K" baked
  // into it blinked on Windows before turning into "Ctrl K"
  const key = useSyncExternalStore<string | null | undefined>(noSubscribe, clientShortcutLabel, () => undefined);

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
        aria-label={key ? t("openKey", { key }) : t("open")}
        title={key ? t("openKey", { key }) : t("open")}
        className="btn btn-ghost flex h-11 min-w-11 items-center justify-center rounded-full border border-line px-2.5 font-mono text-xs font-medium text-muted sm:h-9 sm:min-w-0"
      >
        {/* phones get a menu icon (sections live here on small screens); desktops see the shortcut */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="lg:hidden">
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
        {/* the space is kept while hidden, so the button does not change width on hydration */}
        <span className={`hidden lg:inline ${key === undefined ? "invisible" : ""}`}>{key ?? "⌘K"}</span>
      </button>
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label={t("label")}
        overlayClassName="cmd-overlay"
        contentClassName="cmd-content"
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3.5">
          {/* touch only: first in the DOM so the dialog focuses it on open, not the search (the
              keyboard covered the list and the locked page could not scroll to the last items);
              shown at the end of the row */}
          <button type="button" onClick={() => setOpen(false)} aria-label={t("close")} className="cmd-close order-last -my-1.5 -mr-2 grid size-11 place-items-center rounded-full text-muted">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="text-muted">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <Command.Input placeholder={t("placeholder")} className="flex-1 bg-transparent text-base outline-none placeholder:text-muted" />
          <kbd className="cmd-keys rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px] text-muted">esc</kbd>
        </div>
        <Command.List className="cmd-list overflow-y-auto overscroll-contain p-2">
          <Command.Empty className="px-3 py-5 text-sm text-muted">{t("empty")}</Command.Empty>
          {SECTION_IDS.map((id) => (
            <Item key={id} label={t("goTo", { section: nav(id) })} group={t("groups.navigate")} onSelect={run(() => smoothScrollTo(id, 72))} />
          ))}
          {PROJECT_LINKS.map((p) => (
            <Item
              key={p.key}
              label={t(p.kind === "online" ? "projectOnline" : "projectCode", { name: p.name })}
              group={t("groups.project")}
              onSelect={run(() => openTab(p.href))}
            />
          ))}
          <Item
            label={t("copyEmail")}
            group={t("groups.action")}
            onSelect={run(async () => showToast((await copyText(CONTACT.email)) ? t("emailCopied") : CONTACT.email))}
          />
          <Item
            label={t("copySiteLink")}
            group={t("groups.action")}
            onSelect={run(async () => {
              const url = siteUrl(homePath(locale));
              showToast((await copyText(url)) ? t("siteLinkCopied") : url);
            })}
          />
          <Item label={t("viewResume")} group={t("groups.action")} onSelect={run(() => openTab(RESUME_VIEW_URL))} />
          <Item label={t("downloadResume")} group={t("groups.action")} onSelect={run(() => downloadFile(RESUME_URL))} />
          <Item label={dark ? t("lightOn") : t("lightOff")} group={t("groups.action")} onSelect={run(toggleTheme)} />
          {/* sound on/off goes here, next to the theme switch, once the site has sounds */}
          {SOCIAL_LINKS.map(({ id, href }) => (
            <Item key={id} label={t(SOCIAL_LABEL[id])} group={t("groups.link")} onSelect={run(() => openTab(href))} />
          ))}
          <Item label={t("otherLanguage")} group={t("groups.language")} onSelect={run(() => router.push(homePath(other)))} />
        </Command.List>
        <div className="cmd-keys flex gap-4 border-t border-line px-4 py-2.5 font-mono text-xs text-muted">
          <span>↑↓ {t("hintNavigate")}</span>
          <span>↵ {t("hintOpen")}</span>
          <span>esc {t("hintClose")}</span>
        </div>
      </Command.Dialog>
    </>
  );
}

const noSubscribe = () => () => {};

/** Saves the file instead of opening it (same-origin, so the download attribute is honored). */
function downloadFile(href: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = "";
  document.body.append(a);
  a.click();
  a.remove();
}

/** Lowercase text without accents, for search. */
export const plain = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

function Item({ label, group, onSelect }: { label: string; group: string; onSelect: () => void }) {
  return (
    // keywords without accents, so "curriculo" or "codigo" still find "currículo" and "código"
    <Command.Item value={label} keywords={[plain(label)]} onSelect={onSelect} className="cmd-item flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-[15px]">
      <span>{label}</span>
      <span className="font-mono text-xs text-muted">{group}</span>
    </Command.Item>
  );
}
