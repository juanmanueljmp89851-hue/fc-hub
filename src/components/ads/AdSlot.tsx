"use client";

import { useEffect, useRef } from "react";
import { AD_CONFIG } from "@/lib/ads-config";

type AdFormat = "auto" | "horizontal" | "vertical" | "rectangle";

interface AdSlotProps {
  /** Ad format hint for AdSense responsive ads */
  format?: AdFormat;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * Responsive AdSense ad slot.
 * Works with Auto Ads enabled in AdSense panel.
 * Container provides width context so Google can pick best ad size.
 */
export function AdSlot({ format = "auto", className = "" }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    if (AD_CONFIG.provider !== "adsense" || pushedRef.current) return;

    // Wait for container to have layout dimensions before pushing
    const timer = setTimeout(() => {
      if (containerRef.current && containerRef.current.offsetWidth > 0) {
        pushedRef.current = true;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        } catch {
          // AdSense script not loaded yet
        }
      }
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  if (AD_CONFIG.provider === "none") return null;

  return (
    <div ref={containerRef} className={`w-full overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={AD_CONFIG.adsense.publisherId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
