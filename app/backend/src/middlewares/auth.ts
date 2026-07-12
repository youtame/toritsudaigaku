// src/middlewares/auth.ts
import { Request, Response, NextFunction } from "express";

export const isAuthenticated = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    if (req.session && (req.session as any).userId) {
        return next();
    }
    res.status(401).json({ authenticated: false, message: "Unauthorized" });
};
