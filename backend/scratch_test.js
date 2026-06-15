import prisma from "./src/prisma.js";
import { ensureBusinessModels } from "./src/services/businessModelsSeed.js";

async function run() {
  try {
    console.log("Running ensureBusinessModels...");
    await ensureBusinessModels();
    console.log("Success!");
  } catch (e) {
    console.error("Error occurred:", e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
