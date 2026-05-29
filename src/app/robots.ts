import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/perfil/", "/auth/"],
      },
    ],
    sitemap: "https://www.modofosa.com.ar/sitemap.xml",
  };
}
