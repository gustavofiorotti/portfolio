import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import pt from "@/messages/pt.json";
import { CONTACT } from "@/lib/contact";
import { MORPHS } from "@/components/ui/MorphIcon";
import { Dock } from "./Dock";

function renderDock() {
  return render(
    <NextIntlClientProvider locale="pt" messages={pt}>
      <Dock />
    </NextIntlClientProvider>,
  );
}

describe("Dock", () => {
  let writeText: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("lists e-mail, LinkedIn, X, GitHub and Instagram in this order, each with a name", () => {
    renderDock();
    const items = screen.getByRole("navigation", { name: pt.contact.dockLabel }).querySelectorAll("a, button");
    expect([...items].map((el) => el.getAttribute("aria-label"))).toEqual([
      "Copiar e-mail",
      "LinkedIn (abre em nova aba)",
      "X (@gufiorotti) (abre em nova aba)",
      "GitHub (abre em nova aba)",
      "Instagram (@gufiorotti) (abre em nova aba)",
    ]);
    expect(screen.getByRole("link", { name: /GitHub/ }).getAttribute("href")).toBe(CONTACT.github);
  });

  it("copies the e-mail (no mailto), shows a toast and morphs the icon into a check for ~2 s", async () => {
    const toasts: string[] = [];
    const onToast = (e: Event) => toasts.push((e as CustomEvent<string>).detail);
    window.addEventListener("app-toast", onToast);
    const { container } = renderDock();
    const mail = () => container.querySelector("button path")!.getAttribute("d");
    expect(screen.queryByRole("link", { name: /mailto/ })).toBeNull();
    expect(mail()).toBe(MORPHS.mail.from);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copiar e-mail" }));
    });
    expect(writeText).toHaveBeenCalledWith(CONTACT.email);
    expect(toasts).toEqual(["E-mail copiado"]);

    act(() => vi.advanceTimersByTime(600));
    expect(mail()).toBe(MORPHS.mail.to);

    act(() => vi.advanceTimersByTime(1400)); // still a check before the 2 s mark
    expect(mail()).toBe(MORPHS.mail.to);
    act(() => vi.advanceTimersByTime(600 + 600)); // timer fires, then the morph back plays
    expect(mail()).toBe(MORPHS.mail.from);
    window.removeEventListener("app-toast", onToast);
  });
});
