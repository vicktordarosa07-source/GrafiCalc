"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function InactivityGuard({ pinLockOnIdle = false }: { pinLockOnIdle?: boolean }) {
  useEffect(() => {
    const minutes = Math.max(5, Number(process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES || 30));
    const timeout = minutes * 60_000;
    let lastActivity = Date.now();
    const update = () => { lastActivity = Date.now(); };
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((event) => window.addEventListener(event, update, { passive: true }));
    const frame = document.querySelector<HTMLIFrameElement>('iframe[title="Área de trabalho GrafiCalc"]');
    const attachFrameActivity = () => {
      try { events.forEach(event => frame?.contentDocument?.addEventListener(event, update, { passive: true })); } catch { /* A replaced or unavailable frame does not interrupt the page guard. */ }
    };
    frame?.addEventListener("load", attachFrameActivity);
    attachFrameActivity();
    const timer = window.setInterval(async () => {
      if (Date.now() - lastActivity < timeout) return;
      if (pinLockOnIdle) {
        const response = await fetch("/api/team/access-mode", { method: "DELETE", cache: "no-store" }).catch(() => null);
        if (response?.ok) window.location.assign("/workspace");
        return;
      }
      await createClient().auth.signOut({ scope: "local" });
      window.location.assign("/entrar?motivo=inatividade");
    }, 30_000);
    return () => {
      window.clearInterval(timer);
      events.forEach((event) => window.removeEventListener(event, update));
      frame?.removeEventListener("load", attachFrameActivity);
      try { events.forEach(event => frame?.contentDocument?.removeEventListener(event, update)); } catch { /* Frame has already navigated. */ }
    };
  }, []);
  return null;
}
