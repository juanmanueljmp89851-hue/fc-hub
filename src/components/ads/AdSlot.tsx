"use client";

import { useEffect, useRef } from "react";
import { AD_CONFIG, AD_SLOTS, type AdSlotKey } from "@/lib/ads-config";

interface AdSlotProps {
  slot: AdSlotKey;
  className?: string;
}

/**
 * Universal ad slot component.
 * Renders AdSense or NitroPay ad based on config.
 * Usage: <AdSlot slot="banner" /> or <AdSlot slot="inFeed" />
 */
export function AdSlot({ slot, className = "" }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);
  const config = AD_SLOTS[slot];

  useEffect(() => {
    if (AD_CONFIG.provider === "none" || loadedRef.current) return;
    loadedRef.current = true;

    if (AD_CONFIG.provider === "adsense") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch {
        // AdSense not loaded yet
      }
    }

    if (AD_CONFIG.provider === "nitropay" && containerRef.current) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).nitroAds?.createAd(config.nitroId, {
          refreshLimit: 10,
          refreshTime: 30,
          format: "display",
          sizes: [[config.width, config.height]],
          report: { enabled: true, icon: true, w498: true },
        });
      } catch {
        // NitroPay not loaded yet
      }
    }
  }, [config]);

  if (AD_CONFIG.provider === "none") return null;

  return (
    <div
      className={`flex items-center justify-center overflow-hidden ${className}`}
      style={{ minHeight: config.height }}
    >
      {AD_CONFIG.provider === "adsense" && (
        <ins
          className="adsbygoogle"
          style={{ display: "inline-block", width: config.width, height: config.height }}
          data-ad-client={AD_CONFIG.adsense.publisherId}
          data-ad-slot={config.adsenseSlot}
        />
      )}

      {AD_CONFIG.provider === "nitropay" && (
        <div ref={containerRef} id={config.nitroId} />
      )}
    </div>
  );
}
