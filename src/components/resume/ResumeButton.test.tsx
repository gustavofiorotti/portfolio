import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import pt from "@/messages/pt.json";
import { CHECK, DOC, DOWNLOAD, ResumeButton } from "./ResumeButton";
import { openResume } from "./use-resume-dialog";

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

  it("document, download arrow and check share the same commands (the morph interpolates numbers)", () => {
    expect(shape(DOWNLOAD)).toBe(shape(DOC));
    expect(shape(CHECK)).toBe(shape(DOC));
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

  it("a click or tap beside the pages closes it, a click on a page or a drag from it does not", () => {
    renderButton();
    mouseClick(screen.getByRole("button", { name: "Ver currículo" }));
    const around = document.querySelector(".resume-pages")!;
    const page = screen.getByRole("img", { name: /página 1/ });
    mouseClick(page);
    // a text selection that starts on the page and ends beside it: the click lands on the container
    fireEvent.pointerDown(page);
    fireEvent.click(around);
    expect(dialog().open).toBe(true);
    tap(around);
    expect(dialog().open).toBe(false);
  });

  it("with a mouse the side button downloads the PDF directly, its document morphing into an arrow on hover", () => {
    const { container } = renderButton();
    const side = screen.getByRole("link", { name: "Baixar currículo (PDF)" });
    expect(side.hasAttribute("download")).toBe(true);
    const d = () => side.querySelector("path")!.getAttribute("d");
    expect(d()).toBe(DOC);
    expect(container.querySelector(".resume-duo")!.hasAttribute("data-open")).toBe(false);
    fireEvent.pointerEnter(container.querySelector(".resume-wrap")!, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(600));
    expect(container.querySelector(".resume-duo")!.hasAttribute("data-open")).toBe(true);
    expect(d()).toBe(DOWNLOAD);
    mouseClick(side);
    act(() => vi.advanceTimersByTime(600));
    expect(d()).toBe(CHECK);
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


  it("the split is a morph: the same pill becomes Ver, it is not swapped for another button", () => {
    renderButton();
    const pill = screen.getByRole("button", { name: "Ver currículo" });
    tap(pill);
    expect(screen.getByRole("button", { name: "Ver" })).toBe(pill);
    expect(dialog().open).toBe(false); // the tap only offers the two choices
  });

  it("closing fades the preview out first, and only then closes it and gives the focus back", () => {
    const real = window.getComputedStyle;
    vi.stubGlobal("getComputedStyle", (el: Element) =>
      el.tagName === "DIALOG" && el.hasAttribute("data-closing") ? ({ animationName: "resume-out" } as CSSStyleDeclaration) : real(el),
    );
    renderButton();
    mouseClick(screen.getByRole("button", { name: "Ver currículo" }));
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    act(() => {
      dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(dialog().hasAttribute("data-closing")).toBe(true);
    expect(dialog().open).toBe(true); // still fading
    act(() => {
      // an animation ending inside the dialog bubbles up: not the dialog's fade
      dialog().querySelector(".resume-close")!.dispatchEvent(new Event("animationend", { bubbles: true }));
    });
    expect(dialog().open).toBe(true);
    act(() => {
      dialog().dispatchEvent(new Event("animationend"));
    });
    expect(dialog().open).toBe(false);
    expect(document.documentElement.classList.contains("resume-open")).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Ver currículo" }));
  });

  it("with less motion it closes at once, with no fade", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), addEventListener() {}, removeEventListener() {} }));
    const real = window.getComputedStyle;
    vi.stubGlobal("getComputedStyle", (el: Element) => (el.tagName === "DIALOG" ? ({ animationName: "resume-out" } as CSSStyleDeclaration) : real(el)));
    renderButton();
    mouseClick(screen.getByRole("button", { name: "Ver currículo" }));
    act(() => {
      fireEvent(dialog(), new Event("cancel", { cancelable: true }));
    });
    act(() => {
      dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(dialog().open).toBe(false);
  });

  it("the split pill does not fold under the open preview; closing folds it and focuses Ver currículo", () => {
    renderButton();
    tap(screen.getByRole("button", { name: "Ver currículo" }));
    tap(screen.getByRole("button", { name: "Ver" }));
    expect(dialog().open).toBe(true);
    act(() => vi.advanceTimersByTime(8000));
    expect(screen.getByRole("button", { name: "Ver" })).toBeTruthy();
    act(() => {
      history.replaceState(null, "");
      dispatchEvent(new PopStateEvent("popstate"));
    });
    act(() => vi.advanceTimersByTime(50));
    expect(screen.queryByRole("button", { name: "Ver" })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Ver currículo" }));
  });

  it("other controls (the ⌘K menu) open the same preview", () => {
    renderButton();
    act(() => openResume());
    expect(dialog().open).toBe(true);
    expect(history.state).toMatchObject({ resumeDialog: true });
  });

  it("forward opens it again; after a reload the stale entry is dropped and the page starts closed", () => {
    history.replaceState({ resumeDialog: true }, "");
    renderButton();
    expect(dialog().open).toBe(false);
    expect(history.state?.resumeDialog).toBeUndefined();
    act(() => {
      history.replaceState({ resumeDialog: true }, "");
      dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(dialog().open).toBe(true);
  });
});
