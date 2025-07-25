
import { defineConfig } from "drizzle-kit";

// Hardcoded database URL for local development
const DATABASE_URL = "postgresql://social_user:social_pass_2024@0.0.0.0:5432/social_media_app";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
