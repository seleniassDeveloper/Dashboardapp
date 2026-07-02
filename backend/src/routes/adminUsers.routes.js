import { Router } from "express";
import { z } from "zod";
import requireAuth from "../middleware/requireAuth.js";
import { getFirebaseAuth } from "../services/firebaseAdmin.js";
import prisma from "../prisma.js";
import { isSuperAdmin } from "../utils/superadmin.js";

const router = Router();

// Middleware para restringir todo acceso solo a Super-Admin
const requireSuperAdmin = (req, res, next) => {
  const email = req.user?.email || req.dbUser?.email;
  if (!req.user?.admin && !isSuperAdmin(email)) {
    return res.status(403).json({ 
      success: false, 
      error: "Acceso denegado. Se requiere cuenta de Super-Admin Global." 
    });
  }
  next();
};

router.use(requireAuth, requireSuperAdmin);

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

// NUEVO: Obtener usuarios con status 'pending' (y opcionalmente 'rejected') desde PostgreSQL
router.get("/users/pending", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        status: { in: ["pending", "rejected"] }
      },
      orderBy: { createdAt: "desc" }
    });
    return res.json({ success: true, users });
  } catch (e) {
    console.error("Error fetching pending users:", e);
    return res.status(500).json({ success: false, error: "No se pudieron listar los usuarios pendientes." });
  }
});

// NUEVO: Obtener todos los usuarios registrados con membresías asociadas
router.get("/users/all", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        memberships: {
          include: {
            business: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return res.json({ success: true, users });
  } catch (e) {
    console.error("Error fetching all users:", e);
    return res.status(500).json({ success: false, error: "No se pudieron listar los usuarios registrados." });
  }
});


// NUEVO: Aprobar usuario
router.post("/users/:uid/approve", async (req, res) => {
  try {
    const uid = String(req.params.uid || "").trim();
    if (!uid) return res.status(400).json({ success: false, error: "uid inválido." });

    // Actualizar PostgreSQL
    await prisma.user.update({
      where: { id: uid },
      data: { status: "active" }
    });

    // Actualizar Firestore (para que el frontend desbloquee instantáneamente la próxima vez que revise)
    try {
      const { getFirestore } = await import("firebase-admin/firestore");
      const db = getFirestore();
      await db.collection("users").doc(uid).update({ active: true });
    } catch (firestoreErr) {
      console.warn("No se pudo sincronizar Firestore para", uid, firestoreErr);
      // No fallamos la request porque la validación final se hace con PostgreSQL ahora
    }

    return res.json({ success: true, message: "Usuario aprobado con éxito." });
  } catch (e) {
    console.error("Error approving user:", e);
    return res.status(500).json({ success: false, error: "No se pudo aprobar el usuario." });
  }
});

// NUEVO: Rechazar usuario
router.post("/users/:uid/reject", async (req, res) => {
  try {
    const uid = String(req.params.uid || "").trim();
    if (!uid) return res.status(400).json({ success: false, error: "uid inválido." });

    await prisma.user.update({
      where: { id: uid },
      data: { status: "rejected" }
    });

    // Opcional: sincronizar Firestore si se desea, aunque status = rejected bloquea en AuthProvider
    try {
      const { getFirestore } = await import("firebase-admin/firestore");
      const db = getFirestore();
      await db.collection("users").doc(uid).update({ active: false });
    } catch (firestoreErr) {
      console.warn("No se pudo sincronizar Firestore para", uid, firestoreErr);
    }

    return res.json({ success: true, message: "Usuario rechazado." });
  } catch (e) {
    console.error("Error rejecting user:", e);
    return res.status(500).json({ success: false, error: "No se pudo rechazar el usuario." });
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

    // 1. Actualizar en Firebase Auth si se enviaron datos
    if (Object.keys(data).length > 0) {
      await auth.updateUser(uid, data);
    }

    // 2. Actualizar en PostgreSQL
    const updateData = {};
    if (data.email) updateData.email = data.email;
    if (data.displayName !== undefined) {
      updateData.name = data.displayName;
      const parts = data.displayName.split(" ");
      updateData.firstName = parts[0] || "";
      updateData.lastName = parts.slice(1).join(" ") || "";
    }
    if (req.body.status) {
      updateData.status = req.body.status;
    }

    await prisma.user.update({
      where: { id: uid },
      data: updateData
    });

    // 3. Sincronizar Firestore si cambia de status
    if (req.body.status) {
      try {
        const { getFirestore } = await import("firebase-admin/firestore");
        const db = getFirestore();
        await db.collection("users").doc(uid).update({ active: req.body.status === "active" });
      } catch (firestoreErr) {
        console.warn("No se pudo sincronizar Firestore para", uid, firestoreErr);
      }
    }

    return res.json({ success: true });
  } catch (e) {
    console.error("Error updating user:", e);
    return res.status(500).json({ success: false, error: "No se pudo actualizar el usuario." });
  }
});

router.delete("/users/:uid", async (req, res) => {
  try {
    const uid = String(req.params.uid || "").trim();
    if (!uid) return res.status(400).json({ success: false, error: "uid inválido." });

    // 1. Eliminar de Firebase Auth
    try {
      const auth = getFirebaseAuth();
      await auth.deleteUser(uid);
    } catch (firebaseErr) {
      console.warn("No se pudo eliminar de Firebase Auth:", firebaseErr);
    }

    // 2. Eliminar de PostgreSQL
    await prisma.user.delete({
      where: { id: uid }
    });

    // 3. Eliminar de Firestore
    try {
      const { getFirestore } = await import("firebase-admin/firestore");
      const db = getFirestore();
      await db.collection("users").doc(uid).delete();
    } catch (firestoreErr) {
      console.warn("No se pudo eliminar de Firestore:", firestoreErr);
    }

    return res.json({ success: true });
  } catch (e) {
    console.error("Error deleting user:", e);
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

