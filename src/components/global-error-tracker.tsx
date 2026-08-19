"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/app/lib/supabase/client";

/**
 * GlobalErrorTracker
 *
 * Invisible component that hooks into the browser's global error and
 * unhandled-rejection events. When a runtime error or a failed promise
 * is detected, it automatically inserts a row into the `app_error_logs`
 * table via the `insert_error_log` RPC.
 *
 * A 5-second deduplication window prevents the same error message from
 * being logged multiple times in rapid succession (e.g. inside a loop
 * or a re-render).
 *
 * Mount this once in layout.tsx — it renders no visible UI.
 */

const DEDUP_WINDOW_MS = 5_000; // 5 seconds

export function GlobalErrorTracker() {
  const recentErrors = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const supabase = createClient();

    const isDuplicate = (key: string): boolean => {
      const now = Date.now();
      const lastSeen = recentErrors.current.get(key);
      if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) return true;
      recentErrors.current.set(key, now);

      // Prune old entries every 20 inserts
      if (recentErrors.current.size > 50) {
        for (const [k, v] of recentErrors.current) {
          if (now - v > DEDUP_WINDOW_MS) recentErrors.current.delete(k);
        }
      }
      return false;
    };

    const logError = async (
      module: string,
      severity: "Warning" | "Critical",
      message: string,
      metadata?: Record<string, unknown>
    ) => {
      try {
        await supabase.rpc("insert_error_log", {
          p_module: module,
          p_severity: severity,
          p_message: message.slice(0, 1000), // Truncate very long messages
          p_metadata: metadata ? JSON.stringify(metadata) : null,
        });
      } catch (e) {
        // Silently fail — we don't want the error tracker itself to crash the app
        console.error("[GlobalErrorTracker] Failed to log error:", e);
      }
    };

    // --- Global uncaught error handler ---
    const handleError = (event: ErrorEvent) => {
      const msg = event.message || "Unknown error";
      const key = `error:${msg}`;
      if (isDuplicate(key)) return;

      const module = inferModule(event.filename);
      logError(module, "Critical", msg, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack?.slice(0, 500),
      });
    };

    // --- Unhandled promise rejection handler ---
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "Unhandled promise rejection";
      const key = `rejection:${msg}`;
      if (isDuplicate(key)) return;

      const stack = reason instanceof Error ? reason.stack?.slice(0, 500) : undefined;
      logError("Application", "Warning", msg, { stack });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null; // Renders nothing
}

/**
 * Attempt to infer a user-friendly module name from the source filename.
 */
function inferModule(filename?: string): string {
  if (!filename) return "Application";
  const lower = filename.toLowerCase();
  if (lower.includes("/inventory")) return "Inventory";
  if (lower.includes("/sales") || lower.includes("/orders")) return "Sales";
  if (lower.includes("/customers") || lower.includes("/loyalty")) return "Customer Management";
  if (lower.includes("/auth") || lower.includes("/login")) return "Authentication";
  if (lower.includes("/pos") || lower.includes("/terminal")) return "POS";
  if (lower.includes("/analytics") || lower.includes("/diagnostics")) return "Analytics";
  if (lower.includes("/audit")) return "Audit";
  if (lower.includes("/products")) return "Products";
  return "Application";
}
