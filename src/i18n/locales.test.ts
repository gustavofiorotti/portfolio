import { describe, expect, it } from "vitest";
import { homePath, isLocale } from "./locales";
import pt from "../messages/pt.json";
import en from "../messages/en.json";

function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe("locales", () => {
  it("serves PT at the root and EN under /en", () => {
    expect(homePath("pt")).toBe("/");
    expect(homePath("en")).toBe("/en");
  });

  it("accepts only the supported locales", () => {
    expect(isLocale("pt")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("es")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("has the same message keys in PT and EN", () => {
    expect(keys(en).sort()).toEqual(keys(pt).sort());
  });
});
