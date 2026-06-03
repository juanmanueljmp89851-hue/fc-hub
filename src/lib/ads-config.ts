/**
 * Ad Platform Configuration
 *
 * Set NEXT_PUBLIC_AD_PROVIDER in .env to switch:
 *   "adsense" | "none"
 *
 * Using responsive auto ads — Google picks the best size/format
 * for each placement based on available space and device.
 */

export type AdProvider = "adsense" | "none";

export const AD_CONFIG = {
  provider: (process.env.NEXT_PUBLIC_AD_PROVIDER || "adsense") as AdProvider,

  adsense: {
    publisherId: process.env.NEXT_PUBLIC_ADSENSE_PUB_ID || "ca-pub-1298419664713208",
    slots: {
      display: "6524932355",
      inArticle: "2585687344",
    },
  },
} as const;
