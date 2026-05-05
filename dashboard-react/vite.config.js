import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@dw": path.resolve(__dirname, "../../DashboardWeb/src"),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    fs: {
      allow: [
        __dirname,
        path.resolve(__dirname, "../../DashboardWeb"),
        path.resolve(__dirname, "../../DashboardWeb/src"),
      ],
    },
  },
});
