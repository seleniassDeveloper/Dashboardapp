import axios from "axios";

async function test() {
  try {
    const res = await axios.get("http://localhost:3001/api/appointments", {
      headers: {
        "x-business-id": "business-default"
      }
    });
    console.log("Status Code:", res.status);
    console.log("Appointments returned:", res.data.length);
    if (res.data.length > 0) {
      console.log("First appointment ID:", res.data[0].id);
      console.log("First appointment businessId:", res.data[0].businessId);
    }
  } catch (error) {
    console.error("HTTP GET ERROR:", error.response ? error.response.status : error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
}

test();
