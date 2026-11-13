"use client";
import { useEffect, useState } from "react";

const TOAST_EVENT = "app-toast";

export function showToast(message: string) {
  window.dispatchEvent(new CustomEvent<string>(TOAST_EVENT, { detail: message }));
}

/** One small message at the bottom of the screen; announced to screen readers. */
export function ToastHost() {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onToast = (e: Event) => {
      setMessage((e as CustomEvent<string>).detail);
      clearTimeout(timer);
      timer = setTimeout(() => setMessage(null), 1900);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      clearTimeout(timer);
    };
  }, []);
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-8 z-[60] flex justify-center">
      {message && (
        <span className="toast-in rounded-full bg-fg px-4 py-2.5 text-sm font-medium text-bg shadow-[0_12px_30px_-12px_var(--shadow-lift)]">
          {message}
        </span>
      )}
    </div>
  );
}
