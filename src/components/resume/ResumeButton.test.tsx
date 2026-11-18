import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import pt from "@/messages/pt.json";
import { ARROW, CHECK_C, EYE, ResumeButton } from "./ResumeButton";

const shape = (d: string) => d.replace(/-?\d*\.?\d+/g, "#");

function renderButton() {
  return render(
    <NextIntlClientProvider locale="pt" messages={pt}>
      <ResumeButton />
    </NextIntlClientProvider>,
  );
}

const dialog = () => document.querySelector("dialog")!;
const tap = (el: Element) => {
  fireEvent.pointerDown(el, { pointerType: "touch" });
  fireEvent.click(el, { detail: 1 });
};
const mouseClick = (el: Element) => {
  fireEvent.pointerDown(el, { pointerType: "mouse" });
  fireEvent.click(el, { detail: 1 });
};

describe("ResumeButton", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    // jsdom has <dialog> but no modal behaviour
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    });
    history.replaceState(null, "");
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("eye, arrow and check share the same commands (the morph interpolates numbers)", () => {
    expect(shape(ARROW)).toBe(shape(EYE));
    expect(shape(CHECK_C)).toBe(shape(EYE));
  });

  it("a mouse click opens the full preview with every page, download and open in a new tab", () => {
    renderButton();
    mouseClick(screen.getByRole("button", { name: "Ver currículo" }));
    expect(dialog().open).toBe(true);
    expect(history.state).toMatchObject({ resumeDialog: true });
    expect(screen.getByRole("img", { name: /página 1 de 1/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Baixar" }).hasAttribute("download")).toBe(true);
    expect(screen.getByRole("link", { name: "Abrir em nova aba" }).getAttribute("target")).toBe("_blank");
    expect(document.activeElement).toBe(dialog());
  });

  it("Enter on the button (a click with detail 0) opens the preview even after a tap elsewhere", () => {
    renderButton();
    const btn = screen.getByRole("button", { name: "Ver currículo" });
    fireEvent.pointerDown(btn, { pointerType: "touch" });
    fireEvent.click(btn, { detail: 0 });
    expect(dialog().open).toBe(true);
  });

  it("the X, Esc and the back button close it, without piling up history entries", () => {
    const back = vi.spyOn(history, "back").mockImplementation(() => {
      history.replaceState(null, "");
      dispatchEvent(new PopStateEvent("popstate"));
    });
    renderButton();
    mouseClick(screen.getByRole("button", { name: "Ver currículo" }));
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(back).toHaveBeenCalledTimes(1);
    expect(dialog().open).toBe(false);

    mouseClick(screen.getByRole("button", { name: "Ver currículo" }));
    const cancel = new Event("cancel", { cancelable: true });
    act(() => void dialog().dispatchEvent(cancel));
    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog().open).toBe(false);

    // the phone's back button: the browser pops the entry by itself
    mouseClick(screen.getByRole("button", { name: "Ver currículo" }));
    act(() => {
      history.replaceState(null, "");
      dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(dialog().open).toBe(false);
    expect(document.documentElement.classList.contains("resume-open")).toBe(false);
  });

  it("with a mouse the icon downloads the PDF directly and morphs eye → arrow on hover", () => {
    const { container } = renderButton();
    const icon = screen.getByRole("link", { name: "Baixar currículo (PDF)" });
    expect(icon.hasAttribute("download")).toBe(true);
    const d = () => icon.querySelector("path")!.getAttribute("d");
    expect(d()).toBe(EYE);
    fireEvent.pointerEnter(container.querySelector(".resume-wrap")!, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(600));
    expect(d()).toBe(ARROW);
    mouseClick(icon);
    expect(dialog().open).toBe(false);
  });

  it("on touch the first tap splits the pill into Ver | Baixar, which folds back after 5 s", () => {
    renderButton();
    tap(screen.getByRole("button", { name: "Ver currículo" }));
    expect(dialog().open).toBe(false);
    expect(screen.getByRole("button", { name: "Ver" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Baixar" }).hasAttribute("download")).toBe(true);
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByRole("button", { name: "Ver" })).toBeNull();
    expect(screen.getByRole("button", { name: "Ver currículo" })).toBeTruthy();
  });

  it("a tap on the icon also splits instead of downloading; Ver then opens the preview", () => {
    renderButton();
    const icon = screen.getByRole("link", { name: "Baixar currículo (PDF)" });
    const ev = fireEvent.pointerDown(icon, { pointerType: "touch" });
    expect(ev).toBe(true);
    const click = new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 });
    act(() => void icon.dispatchEvent(click));
    expect(click.defaultPrevented).toBe(true);
    tap(screen.getByRole("button", { name: "Ver" }));
    expect(dialog().open).toBe(true);
  });
});
