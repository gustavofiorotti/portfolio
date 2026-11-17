import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
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
});
