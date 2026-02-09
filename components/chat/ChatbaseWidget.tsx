"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";

declare global {
  interface Window {
    chatbase: any;
  }
}

export function ChatbaseWidget() {
  const { user, loading } = useAuth();
  const hasIdentified = useRef(false);

  useEffect(() => {
    // Initialize chatbase queue
    if (!window.chatbase || window.chatbase("getState") !== "initialized") {
      window.chatbase = (...args: any[]) => {
        if (!window.chatbase.q) {
          window.chatbase.q = [];
        }
        window.chatbase.q.push(args);
      };
      window.chatbase = new Proxy(window.chatbase, {
        get(target: any, prop: string) {
          if (prop === "q") {
            return target.q;
          }
          return (...args: any[]) => target(prop, ...args);
        },
      });
    }

    // Load the Chatbase embed script
    const onLoad = () => {
      if (document.getElementById("14ZkHiYWHEiiCIxHAWiA5")) return;
      const script = document.createElement("script");
      script.src = "https://www.chatbase.co/embed.min.js";
      script.id = "14ZkHiYWHEiiCIxHAWiA5";
      (script as any).domain = "www.chatbase.co";
      document.body.appendChild(script);
    };

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad);
      return () => window.removeEventListener("load", onLoad);
    }
  }, []);

  // Identify user with Chatbase when signed in
  useEffect(() => {
    // Wait for auth to finish loading before making any API calls
    if (loading) return;

    // Reset identification flag on logout
    if (!user) {
      hasIdentified.current = false;
      return;
    }

    // Only identify once per session
    if (hasIdentified.current || !window.chatbase) return;

    const identifyUser = async () => {
      try {
        const res = await fetch("/api/chatbase-token");
        if (res.ok) {
          const { token } = await res.json();
          if (token) {
            window.chatbase("identify", { token });
            hasIdentified.current = true;
          }
        }
        // Silently ignore 401 — expected when session is expired or user is not authenticated
      } catch {
        // Network errors are non-critical for chatbase identification
      }
    };
    identifyUser();
  }, [user, loading]);

  return null;
}
