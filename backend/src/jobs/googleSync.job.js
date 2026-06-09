import cron from "node-cron";
import prisma from "../prisma.js";
import { syncGoogleCalendarToDb } from "../services/googleService.js";

export function startGoogleSyncJob() {
  // Se ejecuta cada 10 minutos
  cron.schedule("*/10 * * * *", async () => {
    console.log("[Google Cron] Iniciando ciclo de sincronización de Google Calendar...");
    try {
      const activeIntegrations = await prisma.business.findMany({
        where: {
          googleRefreshToken: { not: null }
        },
        select: {
          id: true,
          name: true
        }
      });

      console.log(`[Google Cron] Encontrados ${activeIntegrations.length} negocios con integración activa.`);

      for (const biz of activeIntegrations) {
        console.log(`[Google Cron] Sincronizando citas para el negocio: ${biz.name} (${biz.id})`);
        const result = await syncGoogleCalendarToDb(biz.id);
        if (result.success) {
          console.log(`[Google Cron] Sincronización exitosa para ${biz.name}: ${result.synced} citas nuevas.`);
        } else {
          console.error(`[Google Cron] Error sincronizando ${biz.name}:`, result.message || result.error);
        }
      }
    } catch (error) {
      console.error("[Google Cron] Error en ciclo de sincronización:", error);
    }
  });
}
