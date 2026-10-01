"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("turnstile_load_failed"));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

type Props = {
  onVerify: (token: string | null) => void;
};

/** ودج Cloudflare Turnstile — لا يُرسم شيئًا إذا لم يُضبط NEXT_PUBLIC_TURNSTILE_SITE_KEY */
export function Turnstile({ onVerify }: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onVerify);

  useEffect(() => {
    callbackRef.current = onVerify;
  }, [onVerify]);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let widgetId: string | null = null;
    let cancelled = false;

    loadTurnstile()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => callbackRef.current(token),
          "expired-callback": () => callbackRef.current(null),
          "error-callback": () => callbackRef.current(null),
        });
      })
      .catch(() => {
        // لا شيء — يبقى التحقق معطّلًا
      });

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [siteKey]);

  if (!siteKey) return null;
  return <div ref={containerRef} className="mt-4" />;
}
