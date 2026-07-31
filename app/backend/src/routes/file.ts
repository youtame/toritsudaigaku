import { Router } from "express";
import { fileController } from "../controllers/fileController";
import { isAuthenticated } from "../middlewares/auth"; // Adjust import path if needed

const router = Router();

// Caution! dev
const devAuthMiddleware = (req: any, res: any, next: any) => {
    req.session = req.session || {};
    req.session.userId = "c42e94cd-a93e-44a3-a48e-d09bed04ae7d";
    next();
};

// Apply authentication middleware to all file routes
router.use(
    process.env.NODE_ENV === "production" ? isAuthenticated : devAuthMiddleware,
);

router.get("/", fileController.getMyFiles);

router.post("/upload-url", fileController.requestUploadUrl);

router.post("/:fileId/permissions", fileController.shareFilePermission);

router.delete("/:fileId", fileController.deleteFile);

router.get("/:fileId/download-url", fileController.getDownloadUrl);

router.delete(
    "/:fileId/permissions/:targetUserId",
    fileController.revokePermission,
);

export default router;
