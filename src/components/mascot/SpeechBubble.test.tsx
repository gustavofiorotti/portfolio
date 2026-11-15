import { act, renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import pt from "@/messages/pt.json";
import { useSpeech } from "./SpeechBubble";

const wrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale="pt" messages={pt}>
    {children}
  </NextIntlClientProvider>
);

describe("useSpeech", () => {
  it("the first happy stroke after the pokes answers at once, with the pet words", () => {
    vi.spyOn(performance, "now").mockReturnValue(10_000);
    const { result } = renderHook(() => useSpeech(), { wrapper });
    act(() => result.current.say("angry"));
    expect(result.current.line?.text).toBe(pt.bobby.angry[0]);

    // right after, still inside the reaction gap: a plain "pet" would wait, "soothed" does not
    vi.spyOn(performance, "now").mockReturnValue(10_200);
    act(() => result.current.say("pet"));
    expect(result.current.line?.text).toBe(pt.bobby.angry[0]);
    act(() => result.current.say("soothed"));
    expect(pt.bobby.pet).toContain(result.current.line?.text);
    vi.restoreAllMocks();
  });

  it("the petting face takes an angry bubble away, but leaves other lines", () => {
    vi.spyOn(performance, "now").mockReturnValue(20_000);
    const { result } = renderHook(() => useSpeech(), { wrapper });
    act(() => result.current.say("angry"));
    act(() => result.current.say("hush"));
    expect(result.current.line).toBeNull();

    act(() => result.current.say("hello"));
    act(() => result.current.say("hush"));
    expect(result.current.line?.text).toBe(pt.bobby.hello[0]);
    vi.restoreAllMocks();
  });
});
