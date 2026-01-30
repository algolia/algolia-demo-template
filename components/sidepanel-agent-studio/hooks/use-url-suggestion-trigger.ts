"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

// Singleton to ensure only one subscription is active
let activeSubscription: ((signature: string) => void) | null = null;

/**
 * Hook that triggers a callback when the URL state changes.
 * Only ONE subscription is active at a time (singleton pattern).
 * This prevents duplicate triggers when multiple component instances exist (mobile + desktop).
 */
export function useUrlSuggestionTrigger(
  callback: (signature: string) => void,
  enabled: boolean = true
) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastSignatureRef = useRef<string>("");

  // Create stable signature from URL
  const pageSignature = useMemo(() => {
    const sorted = Array.from(searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    return `${pathname}?${sorted}`;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Register this callback as the active subscription (singleton)
    activeSubscription = callback;

    return () => {
      // Only clear if we're still the active subscription
      if (activeSubscription === callback) {
        activeSubscription = null;
      }
    };
  }, [callback, enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Only proceed if we're the active subscription
    if (activeSubscription !== callback) {
      return;
    }

    // Skip if signature hasn't changed
    if (pageSignature === lastSignatureRef.current) {
      return;
    }

    // Mark as processed
    lastSignatureRef.current = pageSignature;

    // Debounce to avoid spam during rapid URL changes
    const timer = setTimeout(() => {
      // Double-check we're still the active subscription
      if (activeSubscription === callback) {
        callback(pageSignature);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [pageSignature, callback, enabled]);
}
