/**
 * The command menu's shortcut as the visitor's keyboard writes it: ⌘K on Apple devices,
 * Ctrl K elsewhere (Windows, Linux, ChromeOS). On touch-only devices there is no keyboard
 * to talk about, so null.
 */
export function shortcutLabel(platform: string, finePointer: boolean): string | null {
  if (!finePointer) return null;
  return /Mac|iPhone|iPad|iPod/i.test(platform) ? "⌘K" : "Ctrl K";
}

/** Reads the platform and pointer from the browser (userAgentData where it exists). */
export function clientShortcutLabel(): string | null {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform || nav.platform || nav.userAgent;
  return shortcutLabel(platform, window.matchMedia?.("(any-pointer: fine)").matches ?? true);
}
