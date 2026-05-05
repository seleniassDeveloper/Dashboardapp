import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

/** Comprueba el token de Firebase y devuelve datos del usuario autenticado. */
router.get("/me", requireAuth, (req, res) => {
  res.json({
    success: true,
    uid: req.user.uid,
    email: req.user.email,
    admin: req.user.admin === true,
  });
});

export default router;
