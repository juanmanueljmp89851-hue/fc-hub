"use client";

import { useEffect, useRef } from "react";
import { AD_CONFIG } from "@/lib/ads-config";

type AdFormat = "auto" | "horizontal" | "vertical" | "rectangle" | "in-article";

interface AdSlotProps {
  /** Ad format hint for AdSense responsive ads */
  format?: AdFormat;
  /** Additional CSS classes for the container */
  className?: string;
}

function getSlotConfig(format: AdFormat) {
  const { slots } = AD_CONFIG.adsense;

  if (format === "in-article") {
    return {
      slotId: slots.inArticle,
      adFormat: "fluid" as const,
      layout: "in-article" as const,
      style: { display: "block", textAlign: "center" as const },
    };
  }

  return {
    slotId: slots.display,
    adFormat: format === "auto" ? "auto" : format,
    layout: undefined,
    style: { display: "block" },
  };
}

/**
 * Responsive AdSense ad slot with real ad unit IDs.
 * Maps format to the correct slot:
 *   - display/horizontal/vertical/rectangle/auto → Display slot
 *   - in-article → In-Article slot (fluid layout)
 */
export function AdSlot({ format = "auto", className = "" }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pushedRef = useRef(false);

  const config = getSlotConfig(format);

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
        style={config.style}
        data-ad-client={AD_CONFIG.adsense.publisherId}
        data-ad-slot={config.slotId}
        data-ad-format={config.adFormat}
        {...(config.layout && { "data-ad-layout": config.layout })}
        data-full-width-responsive="true"
      />
    </div>
  );
}
