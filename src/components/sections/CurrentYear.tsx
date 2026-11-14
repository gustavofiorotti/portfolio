"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** The visitor's current year; the static HTML carries the build year until hydration. */
export function CurrentYear({ fallback }: { fallback: number }) {
  const year = useSyncExternalStore(noop, () => new Date().getFullYear(), () => fallback);
  return <>{year}</>;
}
