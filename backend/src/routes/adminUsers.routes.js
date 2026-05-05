import { Router } from "express";
import { z } from "zod";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import { getFirebaseAuth } from "../services/firebaseAdmin.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/users", async (_req, res) => {
  try {
    const auth = getFirebaseAuth();
    const list = await auth.listUsers(1000);
    const users = (list.users || []).map((u) => ({
      uid: u.uid,
      email: u.email || null,
      displayName: u.displayName || null,
      disabled: Boolean(u.disabled),
      providerIds: (u.providerData || []).map((p) => p.providerId),
      lastSignInTime: u.metadata?.lastSignInTime || null,
      creationTime: u.metadata?.creationTime || null,
    }));
    return res.json({ success: true, users });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: "No se pudieron listar usuarios." });
  }
});

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().trim().min(1).max(120).optional(),
});

router.post("/users", async (req, res) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Datos inválidos." });
    }
    const auth = getFirebaseAuth();
    const user = await auth.createUser({
      email: parsed.data.email.toLowerCase().trim(),
      password: parsed.data.password,
      displayName: parsed.data.displayName,
      emailVerified: false,
      disabled: false,
    });
    return res.status(201).json({ success: true, uid: user.uid });
  } catch (e) {
    console.error(e);
    const code = e?.errorInfo?.code || e?.code || "";
    if (String(code).includes("email-already-exists")) {
      return res.status(409).json({ success: false, error: "Ya existe una cuenta con ese email." });
    }
    return res.status(500).json({ success: false, error: "No se pudo crear el usuario." });
  }
});

const updateSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  displayName: z.string().trim().min(1).max(120).nullable().optional(),
  disabled: z.boolean().optional(),
});

router.patch("/users/:uid", async (req, res) => {
  try {
    const uid = String(req.params.uid || "").trim();
    if (!uid) return res.status(400).json({ success: false, error: "uid inválido." });

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Datos inválidos." });
    }

    const auth = getFirebaseAuth();
    const data = { ...parsed.data };
    if (typeof data.email === "string") data.email = data.email.toLowerCase().trim();
    if (data.displayName === null) data.displayName = "";

    await auth.updateUser(uid, data);
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: "No se pudo actualizar el usuario." });
  }
});

router.delete("/users/:uid", async (req, res) => {
  try {
    const uid = String(req.params.uid || "").trim();
    if (!uid) return res.status(400).json({ success: false, error: "uid inválido." });
    const auth = getFirebaseAuth();
    await auth.deleteUser(uid);
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: "No se pudo eliminar el usuario." });
  }
});

const setAdminSchema = z.object({ admin: z.boolean() });
router.post("/users/:uid/admin", async (req, res) => {
  try {
    const uid = String(req.params.uid || "").trim();
    const parsed = setAdminSchema.safeParse(req.body);
    if (!uid || !parsed.success) {
      return res.status(400).json({ success: false, error: "Datos inválidos." });
    }
    const auth = getFirebaseAuth();
    await auth.setCustomUserClaims(uid, { admin: parsed.data.admin });
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: "No se pudo cambiar el rol." });
  }
});

export default router;

