"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

declare global {
  interface Window {
    chatbase: any;
  }
}

export function ChatbaseWidget() {
  const { user } = useAuth();

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
    if (user && window.chatbase) {
      const identifyUser = async () => {
        try {
          const res = await fetch("/api/chatbase-token");
          if (res.ok) {
            const { token } = await res.json();
            if (token) {
              window.chatbase("identify", { token });
            }
          }
        } catch (error) {
          console.error("Error identifying user with Chatbase:", error);
        }
      };
      identifyUser();
    }
  }, [user]);

  return null;
}
