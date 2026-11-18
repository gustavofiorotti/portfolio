import { afterEach, describe, expect, it } from "vitest";
import { footerVariantScript } from "./footer-variant";

const run = (big: boolean, search: string) => {
  history.replaceState(null, "", `/${search}`);
  new Function(footerVariantScript(big))();
  return document.documentElement.hasAttribute("data-gufi-big");
};

describe("footerVariantScript", () => {
  afterEach(() => document.documentElement.removeAttribute("data-gufi-big"));
  it("follows the constant without a query", () => {
    expect(run(false, "")).toBe(false);
    expect(run(true, "")).toBe(true);
  });
  it("lets ?gufi= override the constant", () => {
    expect(run(false, "?gufi=grande")).toBe(true);
    document.documentElement.removeAttribute("data-gufi-big");
    expect(run(true, "?gufi=normal")).toBe(false);
  });
});
