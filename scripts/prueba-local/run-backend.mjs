// Arranca SOLO la app Express real (sin auto-migración ni jobs) usando la base local.
// Las variables DATABASE_URL / AUTH_DISABLED / PORT las inyecta el lanzador (iniciar.mjs).
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appPath = resolve(__dirname, "../../backend/src/app.js");

const { default: app } = await import(appPath);

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[backend] API lista en http://localhost:${PORT}`);
});
