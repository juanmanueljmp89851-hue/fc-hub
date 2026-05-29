/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // RSS feed image sources
      { protocol: "https", hostname: "**.ole.com.ar" },
      { protocol: "https", hostname: "**.uecdn.es" },
      { protocol: "https", hostname: "**.bbci.co.uk" },
      { protocol: "https", hostname: "**.dexerto.com" },
      { protocol: "https", hostname: "**.futurecdn.net" },
      // YouTube thumbnails (influencers)
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      // User avatars (Supabase storage)
      { protocol: "https", hostname: "**.supabase.co" },
      // Google auth avatars
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // FUTBIN player images
      { protocol: "https", hostname: "cdn.futbin.com" },
    ],
  },
};

export default nextConfig;
