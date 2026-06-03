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
 * Uses data-ad-format="auto" + data-full-width-responsive="true"
 * so Google picks the best size for the available space.
 *
 * Usage:
 *   <AdSlot />                          — auto format (Google picks)
 *   <AdSlot format="horizontal" />      — prefer banner/leaderboard
 *   <AdSlot format="rectangle" />       — prefer 300x250 / 336x280
 *   <AdSlot format="vertical" />        — prefer skyscraper/sidebar
 */
export function AdSlot({ format = "auto", className = "" }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    if (AD_CONFIG.provider !== "adsense" || pushedRef.current) return;
    pushedRef.current = true;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // AdSense script not loaded yet
    }
  }, []);

  if (AD_CONFIG.provider === "none") return null;

  return (
    <div
      ref={containerRef}
      className={`ad-container flex items-center justify-center overflow-hidden ${className}`}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={AD_CONFIG.adsense.publisherId}
        data-ad-slot=""
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
