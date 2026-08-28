import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bend Lite",
    short_name: "Bend Lite",
    description: "A focused, local-first stretching routine player.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b7ff5",
    icons: [
      {
        src: "/icons/bend-lite-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/bend-lite-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/bend-lite-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
