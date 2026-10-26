// /manifest.webmanifest: name, colours and icons for "Add to home screen".

import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: "Nebula",
    description: "Sallë mësimi me qira në Tetovë · Classroom for rent in Tetovo",
    start_url: "/",
    display: "browser",
    background_color: "#c7e03c",
    theme_color: "#c7e03c",
    lang: "sq",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
