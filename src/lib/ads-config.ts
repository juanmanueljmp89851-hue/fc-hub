/**
 * Ad Platform Configuration
 *
 * Replace placeholder IDs with real ones after creating accounts:
 * - AdSense: https://www.google.com/adsense → get your ca-pub-XXXX ID
 * - NitroPay: https://nitropay.com → get your Site ID
 *
 * Set NEXT_PUBLIC_AD_PROVIDER in .env to switch between platforms:
 *   "nitropay" | "adsense" | "none"
 */

export type AdProvider = "nitropay" | "adsense" | "none";

export const AD_CONFIG = {
  provider: (process.env.NEXT_PUBLIC_AD_PROVIDER || "adsense") as AdProvider,

  adsense: {
    publisherId: process.env.NEXT_PUBLIC_ADSENSE_PUB_ID || "ca-pub-1298419664713208",
  },

  nitropay: {
    siteId: process.env.NEXT_PUBLIC_NITROPAY_SITE_ID || "XXXXXXXXXX",
  },
} as const;

// Standard ad slot sizes
export const AD_SLOTS = {
  // Top banner (leaderboard)
  banner: { width: 728, height: 90, nitroId: "banner-top", adsenseSlot: "1234567890" },
  // In-feed (between news cards)
  inFeed: { width: 300, height: 250, nitroId: "in-feed", adsenseSlot: "2345678901" },
  // Sidebar rectangle
  sidebar: { width: 300, height: 250, nitroId: "sidebar", adsenseSlot: "3456789012" },
  // Sticky footer (mobile)
  stickyFooter: { width: 320, height: 50, nitroId: "sticky-footer", adsenseSlot: "4567890123" },
} as const;

export type AdSlotKey = keyof typeof AD_SLOTS;
