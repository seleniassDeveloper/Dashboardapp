const axios = require('axios');

async function run() {
  const rows = [];
  for(let i=0; i<800; i++) {
    rows.push({ Concepto: `Pago ${i}`, Monto: "100" });
  }

  const start = Date.now();
  console.log("Sending 800 rows...");
  try {
    const res = await axios.post('http://localhost:3001/api/google/import', {
      sheetUrl: "",
      entityType: "expenses",
      mapping: { name: "Concepto", amount: "Monto" },
      rows
    }, {
      headers: { "Content-Type": "application/json" }
    });
    console.log("Success:", res.data);
  } catch (e) {
    console.error("Error:", e.message);
  }
  console.log(`Took ${Date.now() - start}ms`);
}

run();
