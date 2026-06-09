import axios from "axios";

async function test() {
  try {
    const payload = {
      firstName: "Test",
      lastName: "Client",
      phone: "123456789",
      email: "testclient@example.com",
      notes: "Test notes",
      serviceId: "cmpinlauq0003ybcjq56brj64",
      professionalId: "cmnm9e5730008yboz99zyrz6i",
      date: "2026-06-12",
      time: "14:00"
    };
    const res = await axios.post("http://localhost:3001/api/public/business/aura-studio/bookings", payload);
    console.log("Status Code:", res.status);
    console.log("Response data:", res.data);
  } catch (error) {
    console.error("HTTP POST ERROR:", error.response ? error.response.status : error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
}

test();
