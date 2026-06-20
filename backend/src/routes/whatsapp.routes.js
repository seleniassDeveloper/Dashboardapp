import { Router } from "express";

const router = Router();

// GET /api/webhooks/whatsapp
router.get("/", (req, res) => {
  if (req.query['hub.verify_token'] === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

// POST /api/webhooks/whatsapp
router.post("/", (req, res) => {
  console.log("Incoming WhatsApp Webhook:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

export default router;
