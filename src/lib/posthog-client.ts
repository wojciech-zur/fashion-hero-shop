import posthog from "posthog-js";

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === "undefined") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!key) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "*",
    },
    disable_session_recording: true,
  });

  initialized = true;
}

export function captureEvent(eventName: string, properties?: Record<string, string | number | boolean | null>) {
  if (typeof window === "undefined") return;
  if (!initialized) {
    initPostHog();
  }
  posthog.capture(eventName, properties);
}
