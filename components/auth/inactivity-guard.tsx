"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function InactivityGuard() {
  useEffect(() => {
    const minutes = Math.max(5, Number(process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES || 30));
    const timeout = minutes * 60_000;
    let lastActivity = Date.now();
    const update = () => { lastActivity = Date.now(); };
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((event) => window.addEventListener(event, update, { passive: true }));
    const timer = window.setInterval(async () => {
      if (Date.now() - lastActivity < timeout) return;
      await createClient().auth.signOut({ scope: "local" });
      window.location.assign("/entrar?motivo=inatividade");
    }, 30_000);
    return () => {
      window.clearInterval(timer);
      events.forEach((event) => window.removeEventListener(event, update));
    };
  }, []);
  return null;
}
