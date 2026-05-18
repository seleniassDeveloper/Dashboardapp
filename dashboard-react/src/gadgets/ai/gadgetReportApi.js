import api from "../../lib/api.js";
export async function postGadgetAiReport(body) {
  const res = await api.post(`/ai/report`, body);
  return res.data;
}
