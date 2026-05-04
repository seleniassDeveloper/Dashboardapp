import axios from "axios";

const API = "http://localhost:3001/api";

export async function postGadgetAiReport(body) {
  const res = await axios.post(`${API}/ai/report`, body);
  return res.data;
}
