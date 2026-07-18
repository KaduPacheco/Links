import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jornada",
    short_name: "Jornada",
    description: "Controle de ponto simples, seguro e rastreável para sua empresa.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B1B32",
    theme_color: "#0B1B32",
    icons: [
      { src: "/icon-192.png?v=5", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png?v=5", sizes: "512x512", type: "image/png", purpose: "any" }
    ]
  };
}
