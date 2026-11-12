"use client";

import Script from "next/script";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: Record<string, unknown>
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

export type TurnstileWidgetHandle = {
  reset: () => void;
};

type TurnstileWidgetProps = {
  siteKey: string;
  onVerify: (token: string | null) => void;
};

function getTurnstileApi(): TurnstileApi | undefined {
  return (window as unknown as { turnstile?: TurnstileApi }).turnstile;
}

export const TurnstileWidget = forwardRef<
  TurnstileWidgetHandle,
  TurnstileWidgetProps
>(function TurnstileWidget({ siteKey, onVerify }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  // The script may already be cached from a previous mount.
  useEffect(() => {
    if (getTurnstileApi()) {
      setScriptLoaded(true);
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      reset: () => {
        const api = getTurnstileApi();
        if (api && widgetIdRef.current) {
          api.reset(widgetIdRef.current);
          onVerifyRef.current(null);
        }
      },
    }),
    []
  );

  useEffect(() => {
    const api = getTurnstileApi();
    if (!scriptLoaded || !api || !containerRef.current || widgetIdRef.current) {
      return;
    }

    widgetIdRef.current = api.render(containerRef.current, {
      sitekey: siteKey,
      theme: "auto",
      callback: (token: string) => onVerifyRef.current(token),
      "expired-callback": () => onVerifyRef.current(null),
      "error-callback": () => onVerifyRef.current(null),
    });

    return () => {
      if (widgetIdRef.current) {
        api.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [scriptLoaded, siteKey]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onError={() => {
          console.error(
            "Failed to load the Turnstile script. Check the CSP and network tab."
          );
        }}
      />
      <div ref={containerRef} />
    </>
  );
});
