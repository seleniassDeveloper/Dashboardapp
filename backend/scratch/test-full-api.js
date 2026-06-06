import app from "../src/app.js";
import prisma from "../src/prisma.js";

const PORT = 3999;

async function run() {
  const server = app.listen(PORT, "127.0.0.1", async () => {
    console.log(`Test server listening on port ${PORT}`);
    
    const endpoints = [
      "/api/inventory/dashboard",
      "/api/inventory/products",
      "/api/inventory/suppliers",
      "/api/inventory/rules",
      "/api/inventory/movements",
      "/api/finances/branches",
      "/api/businesses/me"
    ];

    try {
      for (const endpoint of endpoints) {
        console.log(`\n---> Fetching: ${endpoint}`);
        const res = await fetch(`http://127.0.0.1:${PORT}${endpoint}`, {
          headers: {
            "Authorization": "Bearer aura-admin-token",
            "x-business-id": "cmpijqxpz0000ybdgguvtpheg" // SSSTudio ID
          }
        });

        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          console.log("Response JSON (sample/keys/errors):", 
            res.status >= 400 ? json : (Array.isArray(json) ? `Array with ${json.length} items` : Object.keys(json))
          );
        } catch {
          console.log("Response Text (non-JSON):", text.slice(0, 200));
        }
      }
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      console.log("\nClosing test server...");
      server.close(async () => {
        await prisma.$disconnect();
        console.log("Done!");
      });
    }
  });
}

run();
