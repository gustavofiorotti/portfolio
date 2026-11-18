import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import pt from "@/messages/pt.json";
import { CommandMenu } from "./CommandMenu";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

function setup(platform: string, finePointer: boolean) {
  vi.spyOn(navigator, "platform", "get").mockReturnValue(platform);
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("any-pointer: fine") ? finePointer : false, addEventListener() {}, removeEventListener() {} }));
  // jsdom has no ResizeObserver or scrollIntoView, which cmdk uses
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  Element.prototype.scrollIntoView = () => {};
  return render(
    <NextIntlClientProvider locale="pt" messages={pt}>
      <CommandMenu />
    </NextIntlClientProvider>,
  );
}

describe("CommandMenu", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows ⌘K on a Mac and Ctrl K on Windows", () => {
    setup("MacIntel", true);
    expect(screen.getByRole("button", { name: "Abrir menu de comandos (⌘K)" })).toBeTruthy();
    cleanup();
    setup("Win32", true);
    expect(screen.getByRole("button", { name: "Abrir menu de comandos (Ctrl K)" })).toBeTruthy();
  });

  it("on a phone it names no keyboard shortcut", () => {
    setup("iPhone", false);
    expect(screen.getByRole("button", { name: "Abrir menu de comandos" })).toBeTruthy();
  });

  it("puts the close button before the search, so the dialog does not focus the search first", async () => {
    setup("iPhone", false);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Abrir menu de comandos" })));
    const close = screen.getByRole("button", { name: "Fechar" });
    const input = screen.getByPlaceholderText("O que você procura?");
    expect(close.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("the static HTML hides the shortcut text, so Windows never sees ⌘K blink", () => {
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    const html = renderToString(
      <NextIntlClientProvider locale="pt" messages={pt}>
        <CommandMenu />
      </NextIntlClientProvider>,
    );
    expect(html).toMatch(/class="hidden lg:inline invisible"/);
    expect(html).toContain('aria-label="Abrir menu de comandos"');
  });

  it("lists each project link that exists, the résumé twice, and every social in the contact data", async () => {
    setup("MacIntel", true);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Abrir menu de comandos (⌘K)" })));
    const options = screen.getAllByRole("option").map((o) => o.textContent);
    for (const label of ["Mão na Obra: ver online", "Mão na Obra: ver código", "juridiQue: ver código", "Ver currículo", "Baixar currículo (PDF)", "Copiar link do site", "Abrir LinkedIn", "Abrir GitHub", "Abrir X", "Abrir Instagram"]) {
      expect(options.some((o) => o?.startsWith(label))).toBe(true);
    }
    // juridiQue has no live site, so no "ver online" entry
    expect(options.some((o) => o?.startsWith("juridiQue: ver online"))).toBe(false);
  });

  it("Ver currículo opens the in-site preview (the same dialog as the hero), not the PDF", async () => {
    const opened = vi.fn();
    const open = vi.spyOn(window, "open");
    window.addEventListener("resume:open", opened);
    setup("MacIntel", true);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Abrir menu de comandos/ })));
    await act(async () => fireEvent.click(screen.getByRole("option", { name: /^Ver currículo/ })));
    window.removeEventListener("resume:open", opened);
    expect(opened).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
  });

  it("copies the site link for the current language and confirms it", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, platform: "MacIntel", clipboard: { writeText } });
    const toasts: string[] = [];
    const onToast = (e: Event) => toasts.push((e as CustomEvent<string>).detail);
    window.addEventListener("app-toast", onToast);
    setup("MacIntel", true);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Abrir menu de comandos/ })));
    await act(async () => fireEvent.click(screen.getByRole("option", { name: /Copiar link do site/ })));
    window.removeEventListener("app-toast", onToast);
    expect(writeText).toHaveBeenCalledWith("https://gufi.vercel.app");
    expect(toasts).toEqual(["Link copiado"]);
  });

  it("finds items typed without accents, and skips the portfolio's own live link", async () => {
    setup("MacIntel", true);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Abrir menu de comandos (⌘K)" })));
    expect(screen.queryByRole("option", { name: /Portfólio: ver online/ })).toBeNull();
    expect(screen.getByRole("option", { name: /Portfólio: ver código/ })).toBeTruthy();
    await act(async () => fireEvent.change(screen.getByPlaceholderText("O que você procura?"), { target: { value: "curriculo" } }));
    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options.some((o) => o?.startsWith("Ver currículo"))).toBe(true);
    expect(options.some((o) => o?.startsWith("Baixar currículo"))).toBe(true);
  });
});
