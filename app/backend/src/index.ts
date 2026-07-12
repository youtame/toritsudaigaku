// index.ts
import express from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import { eq } from "drizzle-orm"; // Drizzle Function

import { pool, db } from "./db.ts"; // Formated Drizzle
import { users } from "./db/schema.ts"; // Schema File
import authRouter from "./routes/auth.ts";

declare module "express-session" {
    interface SessionData {
        userId: string;
    }
}

dotenv.config();

if (!process.env.SESSION_SECRET) {
    console.error("FATAL ERROR: SESSION_SECRET is not defined.");
    process.exit(1);
}

const app = express();
app.set("trust proxy", 1);
const port = 3000;
const isProd = process.env.NODE_ENV === "production";

// Helmet settings
app.use(
    helmet({
        xFrameOptions: false,
        xContentTypeOptions: false,
        hsts: false,
        referrerPolicy: false,

        crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
        contentSecurityPolicy: isProd
            ? {
                  directives: {
                      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                      "script-src": [
                          "'self'",
                          "https://apis.google.com",
                          "https://accounts.google.com",
                          "https://www.googletagmanager.com",
                          "'unsafe-inline'",
                      ],
                      "connect-src": [
                          "'self'",
                          "https://accounts.google.com",
                          "https://www.google-analytics.com",
                      ],
                      "style-src": [
                          "'self'",
                          "https://fonts.googleapis.com",
                          "'unsafe-inline'",
                      ],
                      "font-src": ["'self'", "https://fonts.gstatic.com"],
                      "frame-src": ["'self'", "https://accounts.google.com"],
                  },
              }
            : false,
    }),
);

if (!isProd) {
    app.use(
        cors({
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            credentials: true,
        }),
    );
}

app.use(express.json());

// Session Middleware
const PgStore = pgSession(session);
app.use(
    session({
        store: new PgStore({ pool: pool, tableName: "session" }),
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
            secure: isProd,
            httpOnly: true,
            sameSite: "lax",
        },
    }),
);

// Routes
app.use("/auth", authRouter);

// Current User API
app.get("/api/me", async (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ authenticated: false });
    }

    try {
        const result = await db
            .select({
                id: users.id,
                displayName: users.displayName,
                avatarUrl: users.avatarUrl,
            })
            .from(users)
            .where(eq(users.id, req.session.userId));

        if (result.length === 0) {
            return res
                .status(404)
                .json({ authenticated: false, error: "User not found" });
        }

        const user = result[0];
        return res.json({
            authenticated: true,
            userId: user.id,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
        });
    } catch (error) {
        next(error);
    }
});

// Error handling
app.use(
    (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
    ) => {
        console.error("Unhandled Error:", err.stack);
        res.status(500).json({
            error: isProd ? "Internal Server Error" : err.message,
        });
    },
);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    pool.query("SELECT NOW()", (err, res) => {
        if (err) console.error("DB Connection Error:", err);
        else console.log("DB Connected Successfully at:", res.rows[0].now);
    });
});
