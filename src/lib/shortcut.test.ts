import { describe, expect, it } from "vitest";
import { shortcutLabel } from "./shortcut";

describe("shortcutLabel", () => {
  it("is ⌘K on a Mac and Ctrl K on Windows and Linux", () => {
    expect(shortcutLabel("MacIntel", true)).toBe("⌘K");
    expect(shortcutLabel("macOS", true)).toBe("⌘K");
    expect(shortcutLabel("Win32", true)).toBe("Ctrl K");
    expect(shortcutLabel("Windows", true)).toBe("Ctrl K");
    expect(shortcutLabel("Linux x86_64", true)).toBe("Ctrl K");
  });

  it("an iPad with a trackpad gets ⌘K; a phone (touch only) gets no shortcut at all", () => {
    expect(shortcutLabel("iPad", true)).toBe("⌘K");
    expect(shortcutLabel("iPhone", false)).toBeNull();
    expect(shortcutLabel("Linux armv8l", false)).toBeNull();
  });
});
