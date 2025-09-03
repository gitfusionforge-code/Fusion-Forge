import { serial, text, timestamp, integer, boolean, pgTable } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Business Settings Table
export const businessSettings = pgTable('business_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// PC Builds Table
export const pcBuilds = pgTable('pc_builds', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  buildType: text('build_type').notNull(),
  budgetRange: text('budget_range').notNull(),
  basePrice: integer('base_price').notNull(),
  profitMargin: integer('profit_margin').notNull(),
  totalPrice: integer('total_price').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  processor: text('processor').notNull(),
  motherboard: text('motherboard').notNull(),
  ram: text('ram').notNull(),
  storage: text('storage').notNull(),
  gpu: text('gpu'),
  casePsu: text('case_psu').notNull(),
  monitor: text('monitor'),
  keyboardMouse: text('keyboard_mouse'),
  mousePad: text('mouse_pad'),
  stockQuantity: integer('stock_quantity').default(0).notNull(),
  lowStockThreshold: integer('low_stock_threshold').default(2).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Components Table
export const components = pgTable('components', {
  id: serial('id').primaryKey(),
  buildId: integer('build_id').references(() => pcBuilds.id).notNull(),
  name: text('name').notNull(),
  specification: text('specification').notNull(),
  price: text('price').notNull(),
  type: text('type').notNull(),
  stockQuantity: integer('stock_quantity').default(0).notNull(),
  lowStockThreshold: integer('low_stock_threshold').default(5).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sku: text('sku'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Inquiries Table
export const inquiries = pgTable('inquiries', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  budget: text('budget').notNull(),
  useCase: text('use_case').notNull(),
  details: text('details').notNull(),
  status: text('status').default('uncompleted').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User Profiles Table
export const userProfiles = pgTable('user_profiles', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  zipCode: text('zip_code'),
  preferences: text('preferences'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Orders Table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  orderNumber: text('order_number').notNull().unique(),
  status: text('status').default('processing').notNull(),
  total: integer('total').notNull(),
  items: text('items').notNull(),
  customerName: text('customer_name'),
  customerEmail: text('customer_email'),
  shippingAddress: text('shipping_address'),
  billingAddress: text('billing_address'),
  paymentMethod: text('payment_method'),
  trackingNumber: text('tracking_number'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const pcBuildsRelations = relations(pcBuilds, ({ many }) => ({
  components: many(components),
}));

export const componentsRelations = relations(components, ({ one }) => ({
  pcBuild: one(pcBuilds, {
    fields: [components.buildId],
    references: [pcBuilds.id],
  }),
}));

// Type exports
export type BusinessSetting = typeof businessSettings.$inferSelect;
export type InsertBusinessSetting = typeof businessSettings.$inferInsert;
export type PcBuild = typeof pcBuilds.$inferSelect;
export type InsertPcBuild = typeof pcBuilds.$inferInsert;
export type Component = typeof components.$inferSelect;
export type InsertComponent = typeof components.$inferInsert;
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;