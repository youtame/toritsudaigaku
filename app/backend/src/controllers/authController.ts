// src/controllers/authController.ts
import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { db } from "../db.ts"; // Formated Drizzle
import { users } from "../db/schema.ts"; // Schema File

// Get Google client from .env
export const getGoogleClient = () => {
    return new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_CALLBACK_URL,
    );
};

// Redirect to Google OAuth
export const redirectToGoogle = (req: Request, res: Response) => {
    const client = getGoogleClient();
    const url = client.generateAuthUrl({
        access_type: "offline",
        prompt: "select_account",
        scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
        ],
    });
    res.redirect(url);
};

// Google callback
export const handleGoogleCallback = async (req: Request, res: Response) => {
    const { code } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const client = getGoogleClient();

    try {
        const { tokens } = await client.getToken(code as string);
        client.setCredentials(tokens);

        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token!,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            throw new Error("Failed to fetch user information");
        }

        const allowedEmails = (process.env.ALLOWED_EMAILS || "")
            .split(",")
            .map((email) => email.trim());

        if (!allowedEmails.includes(payload.email)) {
            console.warn(
                `Access denied: not registered email address (${payload.email})`,
            );
            return res.redirect(`${frontendUrl}/login?error=not_allowed`);
        }

        // Upset with Drizzle ORM
        const dbRes = await db
            .insert(users)
            .values({
                googleId: payload.sub,
                email: payload.email,
                displayName: payload.name,
                avatarUrl: payload.picture,
                lastLogin: new Date(),
            })
            .onConflictDoUpdate({
                target: users.googleId,
                set: {
                    displayName: payload.name,
                    avatarUrl: payload.picture,
                    lastLogin: new Date(),
                },
            })
            .returning();

        (req.session as any).userId = dbRes[0].id;
        res.redirect(`${frontendUrl}/dashboard`);
    } catch (error) {
        console.error("OAuth Error:", error);
        res.redirect(`${frontendUrl}/login?error=not_allowed`);
    }
};

// Google OAuth logout
export const logout = (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ success: false });
        res.clearCookie("connect.sid");
        res.json({ success: true });
    });
};
