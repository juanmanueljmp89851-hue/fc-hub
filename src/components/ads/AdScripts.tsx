"use client";

import Script from "next/script";
import { AD_CONFIG } from "@/lib/ads-config";

/**
 * Ad platform scripts — include once in layout.
 * Loads AdSense or NitroPay SDK based on NEXT_PUBLIC_AD_PROVIDER env var.
 */
export function AdScripts() {
  if (AD_CONFIG.provider === "none") return null;

  if (AD_CONFIG.provider === "adsense") {
    return (
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CONFIG.adsense.publisherId}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
    );
  }

  if (AD_CONFIG.provider === "nitropay") {
    return (
      <Script id="nitropay-init" strategy="afterInteractive">
        {`
          window.nitroAds = window.nitroAds || { createAd: function() { return new Promise(function(e) { window.nitroAds.queue = window.nitroAds.queue || []; window.nitroAds.queue.push(["createAd", arguments, e]); }); } };
        `}
      </Script>
    );
  }

  return null;
}
