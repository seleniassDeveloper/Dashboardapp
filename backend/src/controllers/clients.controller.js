import { prisma } from "../prisma.js";

export async function listClients(req, res, next) {
  try {
    const data = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createClient(req, res, next) {
  try {
    const { fullName, phone, email, notes } = req.body;

    if (!fullName || fullName.trim().length < 2) {
      return res
        .status(400)
        .json({ ok: false, error: "fullName is required (min 2 chars)" });
    }

    const created = await prisma.client.create({
      data: {
        fullName: fullName.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    res.status(201).json({ ok: true, data: created });
  } catch (err) {
    next(err);
  }
}