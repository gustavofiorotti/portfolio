"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { CONTACT } from "@/lib/contact";
import { copyText } from "@/lib/copy";
import { DOCK, dockSizes, dockWidth, fitDock, hoveredIcon, type Geometry } from "@/lib/dock";
import { showToast } from "@/components/ui/Toast";
import { MORPHS, useMorphPath } from "@/components/ui/MorphIcon";
import { FilledGlyph, GLYPHS, GlassGlyph, RESTING_LIGHT, StrokedGlyph, type Light } from "./DockIcon";

const BAR_ABOVE = 24; // bar height = icon size + this
const BAR_BOTTOM = 11;
const SCRUB_PX = 8; // a touch that moves more than this is a scrub, not a tap
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
const restFor = (g: Geometry): DockState => ({ pointer: null, sizes: dockSizes(null, COUNT, undefined, g) });

/** Light under the pointer for the hovered icon, in its 24×24 glyph units. */
function lightFor(pointer: Pointer, index: number, sizes: number[], hovered: number, g: Geometry): Light {
  if (!pointer || index !== hovered) return RESTING_LIGHT;
  const size = sizes[index];
  const left = g.pad + sizes.slice(0, index).reduce((a, b) => a + b + g.gap, 0);
  const cx = left + size / 2;
  const cy = g.base + BAR_ABOVE - BAR_BOTTOM - size / 2;
  return { x: 12 + ((pointer.x - cx) / size) * 24, y: 12 + ((pointer.y - cy) / size) * 24, z: 7, strength: 2.6 };
}

/** macOS-like dock: icons take real space as they grow, glass glyphs lit by the pointer. */
export function Dock() {
  const t = useTranslations("contact");
  const reduce = useReducedMotion();
  const [geo, setGeo] = useState<Geometry>(DOCK);
  const [{ pointer, sizes }, setDock] = useState<DockState>(() => restFor(DOCK));
  const [pressed, setPressed] = useState(-1);
  const navRef = useRef<HTMLElement>(null);
  const touch = useRef<{ x: number; y: number; scrub: boolean } | null>(null);
  const swallowClick = useRef(false);
  const swallowTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mailPath = useMorphPath(MORPHS.mail.from, MORPHS.mail.to, copied);

  // one state update per frame, however fast the pointer events arrive
  const frame = useRef(0);
  const latest = useRef<{ fromCenter: number; y: number } | null>(null);

  useEffect(
    () => () => {
      clearTimeout(copiedTimer.current);
      clearTimeout(swallowTimer.current);
      cancelAnimationFrame(frame.current);
    },
    [],
  );

  // small phones: the dock and its magnification shrink to the room the section gives it
  useEffect(() => {
    // measure the section's content box: the dock's own wrapper shrinks to the dock, which
    // would feed its own size back into the fit
    const host = navRef.current?.closest("section");
    if (!host) return;
    let last: Geometry | null = null;
    const fit = () => {
      const cs = getComputedStyle(host);
      const room = host.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (!(room > 0)) return; // not laid out (yet)
      const g = fitDock(room, COUNT);
      // ResizeObserver also fires for changes that keep the same fit: then leave the dock alone
      if (last && last.base === g.base && last.max === g.max) return;
      last = g;
      setGeo(g);
      setDock(restFor(g));
    };
    fit();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", fit);
      return () => window.removeEventListener("resize", fit);
    }
    const ro = new ResizeObserver(fit);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  const hovered = hoveredIcon(pointer?.x ?? null, sizes, geo);

  function onMove(e: PointerEvent<HTMLElement>) {
    if (e.pointerType !== "mouse") {
      // touch: magnify while the finger is down and slides over the dock
      const t0 = touch.current;
      if (!t0) return;
      if (!t0.scrub && Math.hypot(e.clientX - t0.x, e.clientY - t0.y) > SCRUB_PX) {
        t0.scrub = true;
        setPressed(-1);
      }
    }
    track(e);
  }

  function track(e: PointerEvent<HTMLElement>) {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const k = rect.width ? el.offsetWidth / rect.width : 1;
    // measured from the bar's center (it stays put, the bar is centered), so x is placed in the
    // layout of the sizes in state rather than in the DOM, which lags behind its transition
    latest.current = { fromCenter: (e.clientX - rect.left - rect.width / 2) * k, y: (e.clientY - rect.top) * k };
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const raw = latest.current;
      if (!raw) return;
      setDock((prev) => {
        const next = { x: dockWidth(prev.sizes, geo) / 2 + raw.fromCenter, y: raw.y };
        // with reduced motion the icons keep their size; the hover light still marks the icon
        return { pointer: next, sizes: reduce ? restFor(geo).sizes : dockSizes(next.x, COUNT, prev.sizes, geo) };
      });
    });
  }

  function onLeave() {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    latest.current = null;
    setDock(restFor(geo));
  }

  function onDown(e: PointerEvent<HTMLElement>) {
    if (e.pointerType === "mouse") return;
    // a new touch starts clean, even if the last slide's click never came
    clearTimeout(swallowTimer.current);
    swallowClick.current = false;
    touch.current = { x: e.clientX, y: e.clientY, scrub: false };
    const rect = e.currentTarget.getBoundingClientRect();
    const x = dockWidth(sizes, geo) / 2 + (e.clientX - rect.left - rect.width / 2);
    setPressed(hoveredIcon(x, sizes, geo)); // pressure feedback on a tap
    track(e);
  }

  function onUp(e: PointerEvent<HTMLElement>) {
    if (e.pointerType === "mouse") return;
    // a scrub only magnifies: lifting the finger must not open whatever icon is under it
    if (touch.current?.scrub) {
      swallowClick.current = true;
      clearTimeout(swallowTimer.current);
      swallowTimer.current = setTimeout(() => (swallowClick.current = false), 400);
    }
    touch.current = null;
    setPressed(-1);
    onLeave();
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
      ref={navRef}
      onPointerMove={onMove}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={(e) => e.pointerType === "mouse" && onLeave()}
      onClickCapture={(e) => {
        if (!swallowClick.current) return;
        swallowClick.current = false;
        e.preventDefault();
        e.stopPropagation();
      }}
      data-active={pointer ? "" : undefined}
      className="dock glass flex items-end overflow-visible rounded-[24px] [border-color:var(--dock-border)]"
      style={{ height: geo.base + BAR_ABOVE, gap: geo.gap, padding: `0 ${geo.pad}px ${BAR_BOTTOM}px` }}
    >
      <button type="button" onClick={copyEmail} aria-label={t("email")} title={t("email")} className={`${ICON_CLASS} ${pressed === 0 ? "is-pressed" : ""} cursor-pointer border-0 bg-transparent p-0`} style={box(0)}>
        <GlassGlyph light={lightFor(pointer, 0, sizes, hovered, geo)} lit={hovered === 0}>
          {(filter) => <StrokedGlyph d={mailPath} filter={filter} />}
        </GlassGlyph>
      </button>
      {LINKS.map((link, j) => {
        const i = j + 1;
        const name = t(link.id);
        return (
          <a key={link.id} href={link.href} target="_blank" rel="noopener" aria-label={t("newTab", { name })} title={name} className={`${ICON_CLASS} ${pressed === i ? "is-pressed" : ""}`} style={box(i)}>
            <GlassGlyph light={lightFor(pointer, i, sizes, hovered, geo)} lit={hovered === i}>
              {(filter) => <FilledGlyph d={GLYPHS[link.id]} filter={filter} />}
            </GlassGlyph>
          </a>
        );
      })}
    </nav>
  );
}
