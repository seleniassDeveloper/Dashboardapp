import api from "../lib/api.js";
export const createAppointment = (data) => {
  return api.post("/appointments", data);
};
