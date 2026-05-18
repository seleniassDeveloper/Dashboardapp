import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["vite.svg"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,woff}"],
        navigateFallback: "/index.html",
      },
      manifest: {
        name: "Dashboard — organiza tu negocio",
        short_name: "Dashboard",
        description: "Citas, equipo, clientes y automatizaciones para tu negocio.",
        theme_color: "#0f172a",
        background_color: "#f8fafc",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        lang: "es",
        categories: ["business", "productivity"],
        icons: [
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  build: {
    sourcemap: false,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
