import { z } from "zod";

// Base types for Firebase Realtime Database
export interface PcBuild {
  id: number;
  name: string;
  category: string;
  buildType: string;
  budgetRange: string;
  basePrice: number;
  profitMargin: number;
  totalPrice: number;
  description?: string;
  imageUrl?: string;
  // Core Components
  processor: string;
  motherboard: string;
  ram: string;
  storage: string;
  gpu?: string;
  casePsu: string;
  // Peripherals (for Full Set builds)
  monitor?: string;
  keyboardMouse?: string;
  mousePad?: string;
  // Meta fields
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Component {
  id: number;
  buildId: number;
  name: string;
  specification: string;
  price: string;
  type: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  sku?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Inquiry {
  id: number;
  name: string;
  email: string;
  phone?: string;
  budget: string;
  useCase: string;
  details: string;
  message?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  preferences?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: number;
  userId: string;
  orderNumber: string;
  status: string;
  total: number;
  items: string;
  customerName?: string;
  customerEmail?: string;
  shippingAddress?: string;
  billingAddress?: string;
  paymentMethod?: string;
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SavedBuild {
  id: number;
  userId: string;
  buildId: number;
  savedAt: Date;
}

export interface UserAddress {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface AdminSetting {
  id: number;
  key: string;
  value: string;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired' | 'pending';
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  basePrice: number;
  discountPercentage: number;
  finalPrice: number;
  items: Array<{
    buildId: number;
    buildName: string;
    category: string;
    quantity: number;
    unitPrice: number;
  }>;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate: Date;
  lastPaymentDate?: Date;
  lastPaymentId?: string;
  customerEmail: string;
  customerName: string;
  shippingAddress: string;
  paymentMethod: string;
  razorpaySubscriptionId?: string;
  totalDelivered: number;
  successfulPayments: number;
  failedPayments: number;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

export interface SubscriptionOrder {
  id: string;
  subscriptionId: string;
  userId: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'failed';
  amount: number;
  items: string; // JSON string of items
  paymentId?: string;
  billingPeriod: string;
  deliveryDate?: Date;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Zod schemas for validation
export const insertPcBuildSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  buildType: z.string().min(1),
  budgetRange: z.string().min(1),
  basePrice: z.number().min(0),
  profitMargin: z.number().min(0),
  totalPrice: z.number().min(0),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  processor: z.string().min(1),
  motherboard: z.string().min(1),
  ram: z.string().min(1),
  storage: z.string().min(1),
  gpu: z.string().optional(),
  casePsu: z.string().min(1),
  monitor: z.string().optional(),
  keyboardMouse: z.string().optional(),
  mousePad: z.string().optional(),
  stockQuantity: z.number().min(0).default(0),
  lowStockThreshold: z.number().min(0).default(2),
  isActive: z.boolean().default(true),
});

export const insertComponentSchema = z.object({
  buildId: z.number(),
  name: z.string().min(1),
  specification: z.string().min(1),
  price: z.string().min(1),
  type: z.string().min(1),
  stockQuantity: z.number().min(0).default(0),
  lowStockThreshold: z.number().min(0).default(5),
  isActive: z.boolean().default(true),
  sku: z.string().optional(),
});

export const insertInquirySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  budget: z.string().min(1),
  useCase: z.string().min(1),
  details: z.string().min(1),
  message: z.string().optional(),
  status: z.string().default("uncompleted"),
});

// Stock update validation schema
export const stockUpdateSchema = z.object({
  stockQuantity: z.number().min(0).max(10000),
});

export const insertUserProfileSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  preferences: z.string().optional(),
});

export const insertOrderSchema = z.object({
  userId: z.string().min(1),
  orderNumber: z.string().min(1),
  status: z.string().default("processing"),
  total: z.number().min(0),
  items: z.string().min(1),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  shippingAddress: z.string().optional(),
  billingAddress: z.string().optional(),
  paymentMethod: z.string().optional(),
  trackingNumber: z.string().optional(),
});

export const insertSavedBuildSchema = z.object({
  userId: z.string().min(1),
  buildId: z.number(),
});

export const insertUserAddressSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  fullName: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  zipCode: z.string().min(1),
  isDefault: z.boolean().default(false),
});

export const insertAdminSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

export const insertSubscriptionSchema = z.object({
  userId: z.string().min(1),
  planId: z.string().min(1),
  planName: z.string().min(1),
  status: z.enum(['active', 'paused', 'cancelled', 'expired', 'pending']).default('pending'),
  billingCycle: z.enum(['monthly', 'quarterly', 'yearly']),
  basePrice: z.number().min(0),
  discountPercentage: z.number().min(0).max(100).default(0),
  finalPrice: z.number().min(0),
  items: z.array(z.object({
    buildId: z.number(),
    buildName: z.string(),
    category: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
  })),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  shippingAddress: z.string().min(1),
  paymentMethod: z.string().min(1),
  razorpaySubscriptionId: z.string().optional(),
});

export const insertSubscriptionOrderSchema = z.object({
  subscriptionId: z.string().min(1),
  userId: z.string().min(1),
  orderNumber: z.string().min(1),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'failed']).default('pending'),
  amount: z.number().min(0),
  items: z.string().min(1),
  paymentId: z.string().optional(),
  billingPeriod: z.string().min(1),
  deliveryDate: z.date().optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
});

// Type exports
export type InsertPcBuild = z.infer<typeof insertPcBuildSchema>;
export type InsertComponent = z.infer<typeof insertComponentSchema>;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertSavedBuild = z.infer<typeof insertSavedBuildSchema>;
export type InsertUserAddress = z.infer<typeof insertUserAddressSchema>;
export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type InsertSubscriptionOrder = z.infer<typeof insertSubscriptionOrderSchema>;