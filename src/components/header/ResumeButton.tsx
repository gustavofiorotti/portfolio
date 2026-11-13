"use client";
import { useState } from "react";
import { lerpPath } from "@/lib/motion-utils";
import { useTween } from "@/lib/use-tween";

const DOWNLOAD = "M12 4 L12 15 M7 10 L12 15 L17 10 M5 20 L19 20";
const CHECK = "M10 18 L10 18 M5 13 L10 18 L19 7 M10 18 L10 18";
export const RESUME_URL = "/curriculo-gustavo-fiorotti.pdf";

/** Download button whose icon morphs into a check after the click. */
export function ResumeButton({ label }: { label: string }) {
  const [done, setDone] = useState(false);
  const k = useTween(done ? 1 : 0);
  return (
    <a
      href={RESUME_URL}
      download
      onClick={() => {
        setDone(true);
        setTimeout(() => setDone(false), 2200);
      }}
      className="btn btn-solid flex h-9 items-center gap-2 rounded-full bg-fg px-3.5 text-sm font-medium whitespace-nowrap text-bg"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={lerpPath(DOWNLOAD, CHECK, k)} />
      </svg>
      {label}
    </a>
  );
}
