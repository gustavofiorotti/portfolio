"use client";

import Image from "next/image";
import { useState, type PointerEvent } from "react";
import { motion, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useTranslations } from "next-intl";
import type { Project } from "@/lib/projects";
import { BrandLogo } from "@/components/header/BrandLogo";
import { MorphIcon, MORPHS } from "@/components/ui/MorphIcon";

// back-to-rest spring with a little overshoot, like the mockup's cubic-bezier(.34,1.56,.64,1)
const SPRING = { stiffness: 260, damping: 20, mass: 0.6 };
const HOVER_SHADOW = "0 34px 70px -34px var(--shadow-lift)";

function ProjectMedia({ project, alt }: { project: Project; alt: string }) {
  const { image } = project;
  if (image.kind === "self") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <BrandLogo size={76} />
        <span className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 font-mono text-[15px] font-medium text-fg">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          gus.poke.site
        </span>
      </div>
    );
  }
  const fit = image.fit === "cover" ? "object-cover" : "object-contain";
  const sizes = "(max-width: 560px) 100vw, 560px";
  if (image.kind === "themed") {
    return (
      <>
        <Image src={image.light} alt={alt} fill sizes={sizes} className={`theme-light-only ${fit}`} />
        <Image src={image.dark} alt={alt} fill sizes={sizes} className={`theme-dark-only ${fit}`} />
      </>
    );
  }
  return <Image src={image.src} alt={alt} fill sizes={sizes} className={fit} />;
}

/** Card button whose icon morphs while it is hovered or focused. */
function MorphLink({ href, className, morph, iconFirst, children }: { href: string; className: string; morph: keyof typeof MORPHS; iconFirst?: boolean; children: React.ReactNode }) {
  const [on, setOn] = useState(false);
  const icon = <MorphIcon {...MORPHS[morph]} active={on} size={morph === "arrow" ? 13 : 14} strokeWidth={morph === "arrow" ? 2.4 : 2.2} />;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={className}
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      onFocus={() => setOn(true)}
      onBlur={() => setOn(false)}
    >
      {iconFirst && icon}
      {children}
      {!iconFirst && icon}
    </a>
  );
}

/** Large project card: 3D tilt following the mouse, scale 1.025, image parallax and a one-shot sheen. */
export function ProjectCard({ project }: { project: Project }) {
  const t = useTranslations("projects");
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(false);
  const rotateX = useSpring(0, SPRING);
  const rotateY = useSpring(0, SPRING);
  const scale = useSpring(1, SPRING);
  const imgX = useTransform(rotateY, (v) => -v * 1.2);
  const imgY = useTransform(rotateX, (v) => v * 1.2);

  const key = `items.${project.id}` as const;
  const href = project.online ?? project.code;
  const note = t.has(`${key}.note`) ? t(`${key}.note`) : null;

  function onMove(e: PointerEvent<HTMLElement>) {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rotateX.set(-py * 8);
    rotateY.set(px * 10);
    scale.set(1.025);
    setHover(true);
  }

  function onLeave() {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
    setHover(false);
  }

  return (
    <motion.article
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX, rotateY, scale, transformPerspective: 1100, boxShadow: hover ? HOVER_SHADOW : "0 0 0 transparent" }}
      className="project-card relative isolate h-full cursor-pointer rounded-[28px] border border-line bg-surface transition-[box-shadow] duration-[450ms] will-change-transform has-[.project-stretch:focus-visible]:outline-2 has-[.project-stretch:focus-visible]:outline-offset-4 has-[.project-stretch:focus-visible]:outline-fg"
    >
      <span className="project-sheen" aria-hidden="true" />
      <div className="flex h-full flex-col overflow-hidden rounded-[27px]">
        <div className="relative aspect-video overflow-hidden bg-card">
          <motion.div className="absolute -inset-3" style={{ x: imgX, y: imgY }}>
            <ProjectMedia project={project} alt={t(`${key}.alt`)} />
          </motion.div>
          {project.image.kind === "self" && (
            <span className="absolute top-4 left-4 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-on-accent">
              {t("youAreHere")}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-3 px-[26px] pt-6 pb-[26px]">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="m-0 font-display text-[26px] font-semibold tracking-[-0.03em]">
              <a
                href={href}
                target="_blank"
                rel="noopener"
                className="project-stretch outline-none"
                aria-label={t(project.online ? "ariaOnline" : "ariaCode", { name: project.name })}
              >
                {project.name}
              </a>
            </h3>
            <span className="font-mono text-xs whitespace-nowrap text-muted">{t(`${key}.period`)}</span>
          </div>
          <p className="m-0 text-[15px] leading-relaxed text-muted">{t(`${key}.desc`)}</p>
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label={t("stack")}>
            {project.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">
                {tag}
              </li>
            ))}
          </ul>
          <div className="relative z-[4] mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold">
            {project.online && (
              <MorphLink href={project.online} morph="arrow" className="soft-btn flex h-9 items-center gap-1.5 rounded-full bg-fg px-3.5 text-bg">
                {t("seeOnline")}
              </MorphLink>
            )}
            {project.code && (
              <MorphLink href={project.code} morph="code" iconFirst className="soft-btn flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5">
                {t("code")}
              </MorphLink>
            )}
            {note && <span className="ml-1 font-normal text-muted">{note}</span>}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
