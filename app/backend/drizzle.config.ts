// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

// make URL from .env
const dbUrl = `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST || "db"}:${process.env.DB_PORT || "5432"}/${process.env.DB_NAME}`;

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dbCredentials: {
        url: dbUrl,
    },
});
