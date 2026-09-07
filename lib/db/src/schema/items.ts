import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const itemsTable = pgTable("catalog_items", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  isAvailable: boolean("is_available").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertItemSchema = createInsertSchema(itemsTable);
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof itemsTable.$inferSelect;