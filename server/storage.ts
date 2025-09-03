import { 
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

// Import Firebase storage implementation
import { firebaseRealtimeStorage } from './firebase-realtime-storage';

// Use Firebase as primary storage
export const storage = firebaseRealtimeStorage;