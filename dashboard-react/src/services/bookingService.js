import axios from "axios";

export const createAppointment = (data) => {
  return axios.post("http://localhost:3001/api/appointments", data);
};
