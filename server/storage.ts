import { db } from "./db";
import { 
  pcBuilds, 
  components, 
  inquiries, 
  userProfiles, 
  orders, 
  savedBuilds, 
  userAddresses,
  adminSettings,
  type PcBuild, 
  type InsertPcBuild, 
  type Component, 
  type InsertComponent, 
  type Inquiry, 
  type InsertInquiry, 
  type UserProfile, 
  type InsertUserProfile, 
  type Order, 
  type InsertOrder, 
  type SavedBuild, 
  type InsertSavedBuild,
  type UserAddress,
  type InsertUserAddress,
  type AdminSetting,
  type InsertAdminSetting
} from "@shared/schema";
import { eq, and, or, desc } from "drizzle-orm";

export interface IStorage {
  // PC Builds
  getPcBuilds(): Promise<PcBuild[]>;
  getPcBuildById(id: number): Promise<PcBuild | undefined>;
  getPcBuildsByCategory(category: string): Promise<PcBuild[]>;
  createPcBuild(build: InsertPcBuild): Promise<PcBuild>;
  updatePcBuild(id: number, buildData: Partial<InsertPcBuild>): Promise<PcBuild>;
  updatePcBuildStock(id: number, stockQuantity: number): Promise<PcBuild>;

  // Components
  getComponentsByBuildId(buildId: number): Promise<Component[]>;
  createComponent(component: InsertComponent): Promise<Component>;
  updateComponentStock(id: number, stockQuantity: number): Promise<Component>;

  // Inquiries
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  getInquiries(): Promise<Inquiry[]>;
  updateInquiryStatus(id: number, status: string): Promise<Inquiry>;
  getInquiriesByStatus(status: string): Promise<Inquiry[]>;
  clearAllInquiries(): Promise<void>;

  // Inventory Management
  getLowStockItems(): Promise<{builds: PcBuild[], components: Component[]}>;
  getStockMovements(itemId?: number, itemType?: 'build' | 'component'): Promise<any[]>;
  createStockMovement(movement: any): Promise<any>;
  getStockAlerts(): Promise<any[]>;
  resolveStockAlert(alertId: number): Promise<void>;

  // User Management
  getUserProfile(uid: string): Promise<UserProfile | undefined>;
  getAllUserProfiles(): Promise<UserProfile[]>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(uid: string, profile: Partial<InsertUserProfile>): Promise<UserProfile>;
  
  // Orders Management
  getUserOrders(userId: string): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  getOrderById(id: number): Promise<Order | undefined>;
  clearAllOrders(): Promise<void>;
  
  // Saved Builds Management
  getUserSavedBuilds(userId: string): Promise<SavedBuild[]>;
  saveUserBuild(savedBuild: InsertSavedBuild): Promise<SavedBuild>;
  removeSavedBuild(userId: string, buildId: number): Promise<void>;
  
  // Address Management
  getUserAddresses(userId: string): Promise<UserAddress[]>;
  saveUserAddress(address: InsertUserAddress): Promise<UserAddress>;
  updateUserAddress(addressId: string, address: Partial<InsertUserAddress>): Promise<UserAddress>;
  deleteUserAddress(addressId: string): Promise<void>;
  setDefaultAddress(userId: string, addressId: string): Promise<void>;
  
  // Admin Settings
  getAdminSetting(key: string): Promise<AdminSetting | undefined>;
  setAdminSetting(key: string, value: string): Promise<AdminSetting>;
  getAllAdminSettings(): Promise<AdminSetting[]>;

  // Account Linking Methods
  getUserProfilesByEmail(email: string): Promise<UserProfile[]>;
  getOrdersByEmail(email: string): Promise<Order[]>;
  getSavedBuildsByEmail(email: string): Promise<SavedBuild[]>;
  mergeUserAccounts(currentUserId: string, email: string, mergeData: {
    profiles: UserProfile[];
    orders: Order[];
    savedBuilds: SavedBuild[];
  }): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // PC Builds
  async getPcBuilds(): Promise<PcBuild[]> {
    return await db.select().from(pcBuilds).orderBy(desc(pcBuilds.createdAt));
  }

  async getPcBuildById(id: number): Promise<PcBuild | undefined> {
    const result = await db.select().from(pcBuilds).where(eq(pcBuilds.id, id));
    return result[0];
  }

  async getPcBuildsByCategory(category: string): Promise<PcBuild[]> {
    return await db.select().from(pcBuilds).where(eq(pcBuilds.category, category));
  }

  async createPcBuild(build: InsertPcBuild): Promise<PcBuild> {
    const result = await db.insert(pcBuilds).values(build).returning();
    return result[0];
  }

  async updatePcBuild(id: number, buildData: Partial<InsertPcBuild>): Promise<PcBuild> {
    const result = await db.update(pcBuilds)
      .set({ ...buildData, updatedAt: new Date() })
      .where(eq(pcBuilds.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error("PC build not found");
    }
    
    return result[0];
  }

  async updatePcBuildStock(id: number, stockQuantity: number): Promise<PcBuild> {
    const result = await db.update(pcBuilds)
      .set({ stockQuantity })
      .where(eq(pcBuilds.id, id))
      .returning();
    return result[0];
  }

  // Components
  async getComponentsByBuildId(buildId: number): Promise<Component[]> {
    return await db.select().from(components).where(eq(components.buildId, buildId));
  }

  async createComponent(component: InsertComponent): Promise<Component> {
    const result = await db.insert(components).values(component).returning();
    return result[0];
  }

  async updateComponentStock(id: number, stockQuantity: number): Promise<Component> {
    const result = await db.update(components)
      .set({ stockQuantity })
      .where(eq(components.id, id))
      .returning();
    return result[0];
  }

  // Inquiries
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const result = await db.insert(inquiries).values(inquiry).returning();
    return result[0];
  }

  async getInquiries(): Promise<Inquiry[]> {
    return await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
  }

  async updateInquiryStatus(id: number, status: string): Promise<Inquiry> {
    const result = await db.update(inquiries)
      .set({ status })
      .where(eq(inquiries.id, id))
      .returning();
    return result[0];
  }

  async getInquiriesByStatus(status: string): Promise<Inquiry[]> {
    return await db.select().from(inquiries).where(eq(inquiries.status, status));
  }

  async clearAllInquiries(): Promise<void> {
    await db.delete(inquiries);
  }

  // Inventory Management
  async getLowStockItems(): Promise<{builds: PcBuild[], components: Component[]}> {
    const lowStockBuilds = await db.select().from(pcBuilds)
      .where(eq(pcBuilds.stockQuantity, pcBuilds.lowStockThreshold));
    
    const lowStockComponents = await db.select().from(components)
      .where(eq(components.stockQuantity, components.lowStockThreshold));

    return {
      builds: lowStockBuilds,
      components: lowStockComponents
    };
  }

  async getStockMovements(): Promise<any[]> {
    // Implement stock movements tracking
    return [];
  }

  async createStockMovement(movement: any): Promise<any> {
    // Implement stock movement creation
    return movement;
  }

  async getStockAlerts(): Promise<any[]> {
    // Implement stock alerts
    return [];
  }

  async resolveStockAlert(alertId: number): Promise<void> {
    // Implement stock alert resolution
  }

  // User Management
  async getUserProfile(uid: string): Promise<UserProfile | undefined> {
    const result = await db.select().from(userProfiles).where(eq(userProfiles.uid, uid));
    return result[0];
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const result = await db.insert(userProfiles).values(profile).returning();
    return result[0];
  }

  async getAllUserProfiles(): Promise<UserProfile[]> {
    return await db.select().from(userProfiles).orderBy(desc(userProfiles.createdAt));
  }

  async updateUserProfile(uid: string, profile: Partial<InsertUserProfile>): Promise<UserProfile> {
    const result = await db.update(userProfiles)
      .set(profile)
      .where(eq(userProfiles.uid, uid))
      .returning();
    return result[0];
  }

  // Orders Management
  async getUserOrders(userId: string): Promise<Order[]> {
    return await db.select().from(orders)
      .where(or(
        eq(orders.userId, userId),
        eq(orders.customerEmail, userId) // Support email-based lookup
      ))
      .orderBy(desc(orders.createdAt));
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(order).returning();
    return result[0];
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const result = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id));
    return result[0];
  }

  async clearAllOrders(): Promise<void> {
    await db.delete(orders);
  }

  // Saved Builds Management
  async getUserSavedBuilds(userId: string): Promise<SavedBuild[]> {
    return await db.select().from(savedBuilds).where(eq(savedBuilds.userId, userId));
  }

  async saveUserBuild(savedBuild: InsertSavedBuild): Promise<SavedBuild> {
    const result = await db.insert(savedBuilds).values(savedBuild).returning();
    return result[0];
  }

  async removeSavedBuild(userId: string, buildId: number): Promise<void> {
    await db.delete(savedBuilds)
      .where(and(eq(savedBuilds.userId, userId), eq(savedBuilds.buildId, buildId)));
  }

  // Address Management
  async getUserAddresses(userId: string): Promise<UserAddress[]> {
    return await db.select().from(userAddresses).where(eq(userAddresses.userId, userId));
  }

  async saveUserAddress(address: InsertUserAddress): Promise<UserAddress> {
    const { nanoid } = await import('nanoid');
    const addressWithId = { ...address, id: nanoid() };
    const result = await db.insert(userAddresses).values(addressWithId).returning();
    return result[0];
  }

  async updateUserAddress(addressId: string, address: Partial<InsertUserAddress>): Promise<UserAddress> {
    const result = await db.update(userAddresses)
      .set(address)
      .where(eq(userAddresses.id, addressId))
      .returning();
    return result[0];
  }

  async deleteUserAddress(addressId: string): Promise<void> {
    await db.delete(userAddresses).where(eq(userAddresses.id, addressId));
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    // First, unset all default addresses for the user
    await db.update(userAddresses)
      .set({ isDefault: false })
      .where(eq(userAddresses.userId, userId));
    
    // Then set the selected address as default
    await db.update(userAddresses)
      .set({ isDefault: true })
      .where(and(eq(userAddresses.userId, userId), eq(userAddresses.id, addressId)));
  }

  // Account Linking Methods
  async getUserProfilesByEmail(email: string): Promise<UserProfile[]> {
    return await db.select().from(userProfiles).where(eq(userProfiles.email, email));
  }

  async getOrdersByEmail(email: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerEmail, email));
  }

  async getSavedBuildsByEmail(email: string): Promise<SavedBuild[]> {
    // This would require joining with user profiles
    const profiles = await this.getUserProfilesByEmail(email);
    if (profiles.length === 0) return [];
    
    const userIds = profiles.map(p => p.uid);
    // Note: This is a simplified implementation - in practice you'd need a proper join
    const builds: SavedBuild[] = [];
    for (const uid of userIds) {
      const userBuilds = await this.getUserSavedBuilds(uid);
      builds.push(...userBuilds);
    }
    return builds;
  }

  async mergeUserAccounts(currentUserId: string, email: string, mergeData: {
    profiles: UserProfile[];
    orders: Order[];
    savedBuilds: SavedBuild[];
  }): Promise<void> {
    // Update orders to current user
    for (const order of mergeData.orders) {
      await db.update(orders)
        .set({ userId: currentUserId })
        .where(eq(orders.id, order.id));
    }

    // Update saved builds to current user
    for (const build of mergeData.savedBuilds) {
      await db.update(savedBuilds)
        .set({ userId: currentUserId })
        .where(eq(savedBuilds.id, build.id));
    }

    // Remove duplicate profiles (keep current user's profile)
    for (const profile of mergeData.profiles) {
      if (profile.uid !== currentUserId) {
        await db.delete(userProfiles).where(eq(userProfiles.uid, profile.uid));
      }
    }
  }

  // Admin Settings
  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    const result = await db.select().from(adminSettings).where(eq(adminSettings.key, key));
    return result[0];
  }

  async setAdminSetting(key: string, value: string): Promise<AdminSetting> {
    const existing = await this.getAdminSetting(key);
    
    if (existing) {
      const result = await db.update(adminSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(adminSettings.key, key))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(adminSettings).values({ key, value }).returning();
      return result[0];
    }
  }

  async getAllAdminSettings(): Promise<AdminSetting[]> {
    return await db.select().from(adminSettings);
  }
}

// Import Firebase storage implementation
import { firebaseRealtimeStorage } from './firebase-realtime-storage';

// Use Firebase as primary storage, NeonDB as backup
export const storage = firebaseRealtimeStorage;