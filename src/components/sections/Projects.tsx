"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { counterValues, filterProjects, projects, techs, toggleTech } from "@/lib/projects";
import { ProjectCard } from "./ProjectCard";
import "./sections.css";

const ENTER = { opacity: 0, y: 18, scale: 0.97, filter: "blur(6px)" };
// drop the filter once shown so it does not keep a compositing layer on every card
const SHOWN = { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } };
const EASE = [0.2, 0.8, 0.2, 1] as const;

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

/** Projects: tech filters (multi-select, ALL logic), counter and the card grid. */
export function Projects() {
  const t = useTranslations("projects");
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<string[]>([]);
  // bumps on every filter change so the cards remount and replay the staggered entry
  const [version, setVersion] = useState(0);
  const firstChip = useRef<HTMLButtonElement>(null);

  const shown = filterProjects(projects, selected);
  const filtering = selected.length > 0;
  const counter = counterValues(shown.length, projects.length);

  function update(next: string[]) {
    setSelected(next);
    setVersion((v) => v + 1);
  }

  // the clear buttons disappear once clicked: move focus to the first chip instead of <body>
  function clear() {
    update([]);
    firstChip.current?.focus();
  }

  const animateEntry = version > 0 && !reduce;

  return (
    <section id="projetos" className="mx-auto max-w-[1120px] px-6 pt-12 pb-24">
      <div className="reveal mb-6 flex flex-wrap items-end justify-between gap-4">
        <h2 className="m-0 font-display text-[clamp(44px,8vw,56px)] leading-none font-semibold tracking-[-0.045em]">{t("title")}</h2>
        <span className="font-mono text-sm font-medium text-muted" aria-live="polite">
          {filtering ? t("counterSome", counter) : t("counterAll", counter)}
        </span>
      </div>

      <div className="reveal mb-8 flex flex-wrap items-center gap-2" role="group" aria-label={t("filterLabel")}>
        {techs.map((tech, i) => {
          const on = selected.includes(tech);
          return (
            <button
              key={tech}
              ref={i === 0 ? firstChip : undefined}
              type="button"
              aria-pressed={on}
              onClick={() => update(toggleTech(selected, tech))}
              className={`soft-btn h-11 cursor-pointer rounded-full border-0 px-[15px] sm:h-9 text-sm font-medium ${on ? "bg-fg text-bg" : "bg-chip text-fg"}`}
            >
              {tech}
            </button>
          );
        })}
        {/* the empty state has its own button, so this one hides there (no duplicate) */}
        {filtering && shown.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="soft-btn flex h-11 sm:h-9 cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-line bg-transparent pr-3 pl-3.5 text-sm font-medium text-muted"
          >
            {t("clearFilters")} <CloseIcon />
          </button>
        )}
      </div>

      {shown.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,480px),1fr))] gap-6">
          {shown.map((project, i) => (
            // the entry animation lives on this wrapper, never on the card that tilts
            <motion.div
              key={`${version}-${project.id}`}
              initial={animateEntry ? ENTER : false}
              animate={SHOWN}
              transition={{ duration: 0.55, ease: EASE, delay: i * 0.06 }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          key={`empty-${version}`}
          initial={reduce ? false : ENTER}
          animate={SHOWN}
          transition={{ duration: 0.55, ease: EASE }}
          className="rounded-[28px] border border-dashed border-line px-6 py-14 text-center text-muted"
        >
          <p className="m-0 mb-1.5 font-display text-xl font-semibold text-fg">{t("emptyTitle")}</p>
          <p className="m-0 mb-[18px] text-[15px]">{t("emptyText")}</p>
          <button
            type="button"
            onClick={clear}
            className="soft-btn h-11 cursor-pointer rounded-full border-0 bg-fg px-4 text-sm font-medium text-bg"
          >
            {t("clearFilters")}
          </button>
        </motion.div>
      )}
    </section>
  );
}
