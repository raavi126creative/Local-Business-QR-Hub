import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const businessTable = pgTable("business_profile", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  phone: text("phone").notNull(),
  location: text("location").notNull(),
  hours: text("hours").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  coverImageUrl: text("cover_image_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBusinessSchema = createInsertSchema(businessTable);
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businessTable.$inferSelect;