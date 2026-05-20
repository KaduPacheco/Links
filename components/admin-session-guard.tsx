"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type AdminSessionGuardProps = {
  idleTimeoutMinutes: number;
};

export function AdminSessionGuard({ idleTimeoutMinutes }: AdminSessionGuardProps) {
  const router = useRouter();
  const timeoutRef = useRef<number | null>(null);
  const isLoggingOutRef = useRef(false);
  const idleTimeoutMs = idleTimeoutMinutes * 60 * 1000;

  useEffect(() => {
    if (!Number.isFinite(idleTimeoutMs) || idleTimeoutMs <= 0) {
      return;
    }

    async function logoutForInactivity() {
      if (isLoggingOutRef.current) {
        return;
      }

      isLoggingOutRef.current = true;

      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          keepalive: true
        });
      } finally {
        router.replace("/admin/login");
        router.refresh();
      }
    }

    function resetTimer() {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        void logoutForInactivity();
      }, idleTimeoutMs);
    }

    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "mousemove", "scroll", "touchstart"];

    for (const eventName of events) {
      window.addEventListener(eventName, resetTimer, { passive: true });
    }

    document.addEventListener("visibilitychange", resetTimer);
    resetTimer();

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      for (const eventName of events) {
        window.removeEventListener(eventName, resetTimer);
      }

      document.removeEventListener("visibilitychange", resetTimer);
    };
  }, [idleTimeoutMs, router]);

  return null;
}
