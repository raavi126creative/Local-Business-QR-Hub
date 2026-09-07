import { createInsertSchema } from "drizzle-zod";
import { boolean, date, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const offersTable = pgTable("special_offers", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  code: text("code").notNull(),
  validUntil: date("valid_until"),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOfferSchema = createInsertSchema(offersTable);
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offersTable.$inferSelect;