import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Ruta dentro del repo (no ../Aplicacion Dashboard/...) para builds en CI/Railway
      "@appdash": path.resolve(__dirname, "src"),
      // Usamos una implementación propia de i18n (src/i18n/index.js) — los aliases
      // redirigen los imports clásicos de react-i18next al shim local así no hace
      // falta instalar paquetes externos.
      "react-i18next": path.resolve(__dirname, "src/i18n/index.js"),
      "i18next-browser-languagedetector": path.resolve(__dirname, "src/i18n/index.js"),
      // Importante: `i18next` debe ir DESPUÉS de los más específicos para que no
      // capture imports como "i18next-browser-languagedetector".
      i18next: path.resolve(__dirname, "src/i18n/index.js"),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["vite.svg"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,woff}"],
        navigateFallback: "/index.html",
        maximumFileSizeToCacheInBytes: 5000000,
      },
      manifest: {
        name: "AuraDash",
        short_name: "AuraDash",
        description: "Organiza tu negocio: citas, equipo, clientes y automatizaciones.",
        theme_color: "#ec4899",
        background_color: "#f6f5fb",
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
    host: true,
  },
});
