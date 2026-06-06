import {
  getInventoryDashboardData,
  listProducts,
  listSuppliers,
  listRules,
  listMovements
} from "../src/controllers/inventory.controller.js";
import prisma from "../src/prisma.js";

// Mock response creator
function makeMockRes(name) {
  return {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      console.log(`[${name}] Status: ${this.statusCode || 200}`);
      if (this.statusCode && this.statusCode >= 400) {
        console.error(`[${name}] Error output:`, data);
      } else {
        console.log(`[${name}] Success output length/keys:`, Array.isArray(data) ? data.length : Object.keys(data));
      }
      return this;
    }
  };
}

async function run() {
  try {
    console.log("Mocking controller calls with quick-booking-user...");
    
    // We need req.businessId and req.user for queries if applicable
    const mockReq = {
      businessId: "cmpijqxpz0000ybdgguvtpheg",
      user: {
        uid: "quick-booking-user",
        email: "quick@booking.com",
        role: "owner",
        permissions: []
      }
    };

    console.log("--- Testing getInventoryDashboardData ---");
    const resDash = makeMockRes("getInventoryDashboardData");
    await getInventoryDashboardData(mockReq, resDash);

    console.log("--- Testing listProducts ---");
    const resProd = makeMockRes("listProducts");
    await listProducts(mockReq, resProd);

    console.log("--- Testing listSuppliers ---");
    const resSup = makeMockRes("listSuppliers");
    await listSuppliers(mockReq, resSup);

    console.log("--- Testing listRules ---");
    const resRules = makeMockRes("listRules");
    await listRules(mockReq, resRules);

    console.log("--- Testing listMovements ---");
    const resMov = makeMockRes("listMovements");
    await listMovements(mockReq, resMov);

  } catch (err) {
    console.error("Test execution threw exception:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
