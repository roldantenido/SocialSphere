import { z } from "zod";

export const setupSchema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  dbHost: z.string().min(1, "Database host is required"),
  dbPort: z.number().int().min(1).max(65535),
  dbName: z.string().min(1, "Database name is required"),
  dbUser: z.string().min(1, "Database username is required"),
  dbPassword: z.string().min(1, "Database password is required"),
  adminUsername: z.string().min(3, "Admin username must be at least 3 characters"),
  adminPassword: z.string().min(6, "Admin password must be at least 6 characters"),
});

export type SetupData = z.infer<typeof setupSchema>;

export interface SetupStatus {
  isConfigured: boolean;
  siteName?: string;
}