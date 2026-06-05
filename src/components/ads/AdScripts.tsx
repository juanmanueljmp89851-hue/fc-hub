"use client";

import Script from "next/script";
import { AD_CONFIG } from "@/lib/ads-config";

/**
 * AdSense SDK script — include once in root layout.
 */
export function AdScripts() {
  if (AD_CONFIG.provider !== "adsense") return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CONFIG.adsense.publisherId}`}
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}
