
async function test() {
  const url = "https://dashboard-api-r6j9.onrender.com/api/public/business/auradashdigital/bookings";
  
  const payload = {
    firstName: "Test",
    lastName: "User",
    phone: "1234567890",
    email: "test@example.com",
    notes: "Test booking",
    serviceId: "cmqehce1q000fda01b8w2yymu", // Assuming a random valid ID or we need to fetch a valid service ID first
    professionalId: "any",
    date: "2026-06-15",
    time: "10:00"
  };

  try {
    const res = await globalThis.fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (e) {
    console.error(e);
  }
}

// First, fetch the public business services to get a valid service ID
async function getServices() {
  const url = "https://dashboard-api-r6j9.onrender.com/api/public/business/auradashdigital/services";
  const res = await globalThis.fetch(url);
  const data = await res.json();
  console.log("Services:", data.map(s => ({ id: s.id, name: s.name })));
  return data[0]?.id;
}

// Then fetch available professionals for that service on a date
async function getProfs(serviceId) {
  const url = `https://dashboard-api-r6j9.onrender.com/api/public/business/auradashdigital/professionals?serviceId=${serviceId}`;
  const res = await globalThis.fetch(url);
  const data = await res.json();
  console.log("Professionals:", data.map(p => ({ id: p.id, name: p.firstName })));
  return data[0]?.id;
}

// Then fetch availability
async function getAvailability(serviceId, profId, date) {
  const url = `https://dashboard-api-r6j9.onrender.com/api/public/business/auradashdigital/availability?date=${date}&serviceId=${serviceId}&professionalId=${profId}`;
  const res = await globalThis.fetch(url);
  const data = await res.json();
  console.log("Availability:", data);
  return data[0]; // first available slot
}

async function runFullTest() {
  const serviceId = await getServices();
  if (!serviceId) return console.log("No services");
  
  const profId = await getProfs(serviceId);
  if (!profId) return console.log("No professionals");
  
  const date = "2026-06-15";
  const time = await getAvailability(serviceId, profId, date);
  if (!time) return console.log("No availability on " + date);
  
  console.log(`Booking ${serviceId} with ${profId} on ${date} at ${time}`);
  
  const url = "https://dashboard-api-r6j9.onrender.com/api/public/business/auradashdigital/bookings";
  const payload = {
    firstName: "Test",
    lastName: "User",
    phone: "1234567890",
    email: "test@example.com",
    notes: "Test booking",
    serviceId: serviceId,
    professionalId: profId,
    date: date,
    time: time
  };
  
  const res = await globalThis.fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  console.log("Booking Status:", res.status);
  console.log("Booking Response:", await res.text());
}

runFullTest();
