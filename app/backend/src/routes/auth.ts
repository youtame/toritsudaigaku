// routes/auth.ts
import express from "express";
import {
    redirectToGoogle,
    handleGoogleCallback,
    logout,
} from "../controllers/authController";

// Define router settings
const router = express.Router();

router.get("/google", redirectToGoogle);

router.get("/google/callback", handleGoogleCallback);

router.post("/logout", logout);

export default router;
