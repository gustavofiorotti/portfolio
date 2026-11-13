"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { CONTACT } from "@/lib/contact";
import { copyText } from "@/lib/copy";
import { DOCK, dockSizes, hoveredIcon } from "@/lib/dock";
import { showToast } from "@/components/ui/Toast";
import { MORPHS, useMorphPath } from "@/components/ui/MorphIcon";
import { FilledGlyph, GLYPHS, GlassGlyph, RESTING_LIGHT, StrokedGlyph, type Light } from "./DockIcon";

const BAR_HEIGHT = 66;
const BAR_BOTTOM = 11;
const COPIED_MS = 2000;

// order by importance (kit-gustavo): e-mail first, it copies instead of opening mailto
const LINKS = [
  { id: "linkedin", href: CONTACT.linkedin },
  { id: "x", href: CONTACT.x },
  { id: "github", href: CONTACT.github },
  { id: "instagram", href: CONTACT.instagram },
] as const;
const COUNT = LINKS.length + 1;

const ICON_CLASS =
  "dock-icon block flex-none rounded-[12px] focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-4 focus-visible:outline-fg";

type Pointer = { x: number; y: number } | null;
type DockState = { pointer: Pointer; sizes: number[] };
const REST: DockState = { pointer: null, sizes: dockSizes(null, COUNT) };

/** Light under the pointer for the hovered icon, in its 24×24 glyph units. */
function lightFor(pointer: Pointer, index: number, sizes: number[], hovered: number): Light {
  if (!pointer || index !== hovered) return RESTING_LIGHT;
  const size = sizes[index];
  const left = DOCK.pad + sizes.slice(0, index).reduce((a, b) => a + b + DOCK.gap, 0);
  const cx = left + size / 2;
  const cy = BAR_HEIGHT - BAR_BOTTOM - size / 2;
  return { x: 12 + ((pointer.x - cx) / size) * 24, y: 12 + ((pointer.y - cy) / size) * 24, z: 7, strength: 2.6 };
}

/** macOS-like dock: icons take real space as they grow, glass glyphs lit by the pointer. */
export function Dock() {
  const t = useTranslations("contact");
  const reduce = useReducedMotion();
  const [{ pointer, sizes }, setDock] = useState<DockState>(REST);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mailPath = useMorphPath(MORPHS.mail.from, MORPHS.mail.to, copied);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const hovered = hoveredIcon(pointer?.x ?? null, sizes);

  function onMove(e: PointerEvent<HTMLElement>) {
    if (e.pointerType !== "mouse") return;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const k = rect.width ? el.offsetWidth / rect.width : 1;
    const next = { x: (e.clientX - rect.left) * k, y: (e.clientY - rect.top) * k };
    // with reduced motion the icons keep their size; the hover light still marks the icon
    setDock((prev) => ({ pointer: next, sizes: reduce ? REST.sizes : dockSizes(next.x, COUNT, prev.sizes) }));
  }

  async function copyEmail() {
    const ok = await copyText(CONTACT.email);
    showToast(ok ? t("emailCopied") : CONTACT.email);
    if (!ok) return;
    setCopied(true);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), COPIED_MS);
  }

  const box = (i: number) => ({ width: Math.round(sizes[i]), height: Math.round(sizes[i]) });

  return (
    <nav
      aria-label={t("dockLabel")}
      onPointerMove={onMove}
      onPointerLeave={() => setDock(REST)}
      className="glass flex items-end overflow-visible rounded-[24px] [border-color:var(--dock-border)]"
      style={{ height: BAR_HEIGHT, gap: DOCK.gap, padding: `0 ${DOCK.pad}px ${BAR_BOTTOM}px` }}
    >
      <button type="button" onClick={copyEmail} aria-label={t("email")} title={t("email")} className={`${ICON_CLASS} cursor-pointer border-0 bg-transparent p-0`} style={box(0)}>
        <GlassGlyph light={lightFor(pointer, 0, sizes, hovered)} lit={hovered === 0}>
          {(filter) => <StrokedGlyph d={mailPath} filter={filter} />}
        </GlassGlyph>
      </button>
      {LINKS.map((link, j) => {
        const i = j + 1;
        const name = t(link.id);
        return (
          <a key={link.id} href={link.href} target="_blank" rel="noopener" aria-label={t("newTab", { name })} title={name} className={ICON_CLASS} style={box(i)}>
            <GlassGlyph light={lightFor(pointer, i, sizes, hovered)} lit={hovered === i}>
              {(filter) => <FilledGlyph d={GLYPHS[link.id]} filter={filter} />}
            </GlassGlyph>
          </a>
        );
      })}
    </nav>
  );
}
