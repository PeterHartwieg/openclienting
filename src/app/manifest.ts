import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name}.org`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/en",
    display: "standalone",
    background_color: "#f9f8f6",
    theme_color: "#2773a5",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
