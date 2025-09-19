import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const downloads = pgTable("downloads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  platform: text("platform").notNull(),
  title: text("title"),
  quality: text("quality", { enum: ["normal", "high"] }).notNull(),
  status: text("status").notNull().default("pending"),
  progress: integer("progress").default(0),
  downloadUrl: text("download_url"),
  fileSize: text("file_size"),
  duration: text("duration"),
  thumbnail: text("thumbnail"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const charityStats = pgTable("charity_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  month: text("month").notNull(),
  year: integer("year").notNull(),
  totalRaised: integer("total_raised").default(0),
  highQualityDownloads: integer("high_quality_downloads").default(0),
  beneficiaries: integer("beneficiaries").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod schemas for validation
export const insertDownloadSchema = createInsertSchema(downloads, {
  quality: z.enum(["normal", "high"])
}).pick({
  url: true,
  platform: true,
  quality: true,
});

export const insertCharityStatsSchema = createInsertSchema(charityStats).pick({
  month: true,
  year: true,
  totalRaised: true,
  highQualityDownloads: true,
  beneficiaries: true,
});

// Export types
export type InsertDownload = z.infer<typeof insertDownloadSchema>;
export type Download = typeof downloads.$inferSelect;
export type InsertCharityStats = z.infer<typeof insertCharityStatsSchema>;
export type CharityStats = typeof charityStats.$inferSelect;
