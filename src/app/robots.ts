import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/auth/",
        "/api/",
        "/en/dashboard/",
        "/de/dashboard/",
        "/en/moderate/",
        "/de/moderate/",
      ],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl.toString(),
  };
}
