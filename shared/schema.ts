import { pgTable, serial, text, integer, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const pcBuilds = pgTable("pc_builds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // Student Essentials, Budget Creators, Student Gaming & Productivity, Mid-Tier Creators & Gamers
  buildType: text("build_type").notNull(), // CPU Only, Full Set
  budgetRange: text("budget_range").notNull(),
  basePrice: integer("base_price").notNull(),
  profitMargin: integer("profit_margin").notNull(),
  totalPrice: integer("total_price").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  // Core Components
  processor: text("processor").notNull(),
  motherboard: text("motherboard").notNull(),
  ram: text("ram").notNull(),
  storage: text("storage").notNull(),
  gpu: text("gpu"),
  casePsu: text("case_psu").notNull(),
  // Peripherals (for Full Set builds)
  monitor: text("monitor"),
  keyboardMouse: text("keyboard_mouse"),
  mousePad: text("mouse_pad"),
  // Meta fields
  stockQuantity: integer("stock_quantity").default(0).notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(2).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const components = pgTable("components", {
  id: serial("id").primaryKey(),
  buildId: integer("build_id").notNull(),
  name: text("name").notNull(),
  specification: text("specification").notNull(),
  price: text("price").notNull(),
  type: text("type").notNull(), // cpu, gpu, ram, storage, etc.
  stockQuantity: integer("stock_quantity").default(0).notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(5).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sku: text("sku"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  budget: text("budget").notNull(),
  useCase: text("use_case").notNull(),
  details: text("details").notNull(),
  status: text("status").default("uncompleted").notNull(), // 'completed' or 'uncompleted'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Stock movements tracking
export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  componentId: integer("component_id"),
  buildId: integer("build_id"), 
  movementType: text("movement_type").notNull(), // 'in', 'out', 'adjustment'
  quantity: integer("quantity").notNull(),
  reason: text("reason"), // 'purchase', 'sale', 'damage', 'adjustment'
  notes: text("notes"),
  createdBy: text("created_by"), // admin user
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Low stock alerts
export const stockAlerts = pgTable("stock_alerts", {
  id: serial("id").primaryKey(),
  componentId: integer("component_id"),
  buildId: integer("build_id"),
  alertType: text("alert_type").notNull(), // 'low_stock', 'out_of_stock'
  currentStock: integer("current_stock").notNull(),
  threshold: integer("threshold").notNull(),
  itemName: text("item_name").notNull(),
  isResolved: boolean("is_resolved").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

// User profiles table
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase UID
  email: text("email").notNull(),
  displayName: text("display_name"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  zipCode: text("zip_code"),
  preferences: text("preferences"), // JSON string for notification preferences
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Firebase UID
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").notNull().default("processing"), // processing, shipped, delivered, cancelled
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  items: text("items").notNull(), // JSON string of order items
  customerName: text("customer_name"), // Customer name from checkout
  customerEmail: text("customer_email"), // Customer email from checkout
  shippingAddress: text("shipping_address"),
  billingAddress: text("billing_address"),
  paymentMethod: text("payment_method"),
  trackingNumber: text("tracking_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Saved builds table (user favorites)
export const savedBuilds = pgTable("saved_builds", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Firebase UID
  buildId: integer("build_id").notNull(),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
});

// User addresses table
export const userAddresses = pgTable("user_addresses", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  zipCode: text("zip_code").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPcBuildSchema = createInsertSchema(pcBuilds).omit({
  id: true,
});

export const insertComponentSchema = createInsertSchema(components).omit({
  id: true,
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  createdAt: true,
});

export const insertStockAlertSchema = createInsertSchema(stockAlerts).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSavedBuildSchema = createInsertSchema(savedBuilds).omit({
  id: true,
  savedAt: true,
});

export const insertUserAddressSchema = createInsertSchema(userAddresses).omit({
  id: true,
  createdAt: true,
});

export type InsertPcBuild = z.infer<typeof insertPcBuildSchema>;
export type PcBuild = typeof pcBuilds.$inferSelect;

export type InsertComponent = z.infer<typeof insertComponentSchema>;
export type Component = typeof components.$inferSelect;

export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Inquiry = typeof inquiries.$inferSelect;

export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;

export type InsertStockAlert = z.infer<typeof insertStockAlertSchema>;
export type StockAlert = typeof stockAlerts.$inferSelect;

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertSavedBuild = z.infer<typeof insertSavedBuildSchema>;
export type SavedBuild = typeof savedBuilds.$inferSelect;

export type InsertUserAddress = z.infer<typeof insertUserAddressSchema>;
export type UserAddress = typeof userAddresses.$inferSelect;