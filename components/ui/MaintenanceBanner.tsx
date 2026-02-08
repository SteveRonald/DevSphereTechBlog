"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

export function MaintenanceBanner() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/system-settings");
        if (!res.ok) return;
        const data = await res.json();
        if (data.maintenance_mode === true) {
          setVisible(true);
        }
      } catch {
        // silently fail
      }
    };
    fetchSettings();
  }, []);

  const handleDismiss = () => {
    setClosing(true);
    // Wait for the slide-up animation to finish before unmounting
    setTimeout(() => setVisible(false), 400);
  };

  if (!visible) return null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes bannerSlideDown {
              from { transform: translateY(-100%); opacity: 0; }
              to   { transform: translateY(0);     opacity: 1; }
            }
            @keyframes bannerSlideUp {
              from { transform: translateY(0);     opacity: 1; }
              to   { transform: translateY(-100%); opacity: 0; }
            }
          `,
        }}
      />

      <div
        role="status"
        aria-live="polite"
        style={{
          width: "100%",
          background: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 50%, #fef9c3 100%)",
          borderBottom: "1px solid #fde68a",
          animation: closing
            ? "bannerSlideUp 0.4s ease-in forwards"
            : "bannerSlideDown 0.5s cubic-bezier(0.16,1,0.3,1) forwards",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                backgroundColor: "#f59e0b",
                flexShrink: 0,
              }}
            >
              <AlertTriangle style={{ width: "14px", height: "14px", color: "#fff" }} />
            </span>
            <p style={{ fontSize: "13px", fontWeight: 500, margin: 0, color: "#78350f", lineHeight: 1.5 }}>
              <strong style={{ fontWeight: 700 }}>Scheduled Maintenance</strong>
              <span style={{ margin: "0 6px", opacity: 0.4 }}>—</span>
              We&apos;re performing updates to improve your experience. Some features may be briefly unavailable.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss maintenance notice"
            style={{
              background: "transparent",
              border: "1px solid #fbbf2440",
              cursor: "pointer",
              color: "#92400e",
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fde68a";
              e.currentTarget.style.borderColor = "#f59e0b";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "#fbbf2440";
            }}
          >
            <X style={{ width: "14px", height: "14px" }} />
          </button>
        </div>
      </div>
    </>
  );
}
