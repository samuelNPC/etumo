import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Etomu Academic AI",
    short_name: "Etomu",
    description: "Your complete AI research and originality workspace.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/icon-192x192.png", // You need to add this image to your public folder
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png", // You need to add this image to your public folder
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable", // Good for Android adaptive icons
      },
    ],
  };
}
