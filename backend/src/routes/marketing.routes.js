import { Router } from "express";
import {
  listPosts,
  createPost,
  updatePost,
  deletePost,
  generateCaption
} from "../controllers/marketing.controller.js";
import { requirePermission } from "../middleware/rbac.middleware.js";

const router = Router();

router.get("/posts", requirePermission("marketing.view"), listPosts);
router.post("/posts", requirePermission("marketing.edit"), createPost);
router.put("/posts/:id", requirePermission("marketing.edit"), updatePost);
router.delete("/posts/:id", requirePermission("marketing.edit"), deletePost);
router.post("/generate-caption", requirePermission("marketing.view"), generateCaption);

export default router;
