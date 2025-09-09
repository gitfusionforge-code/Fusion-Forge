import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, get, set, push, update, remove, child, query, orderByChild, equalTo } from "firebase/database";
import type { 
  PcBuild, 
  InsertPcBuild, 
  Component, 
  InsertComponent, 
  Inquiry, 
  InsertInquiry, 
  UserProfile, 
  InsertUserProfile, 
  Order, 
  InsertOrder, 
  SavedBuild, 
  InsertSavedBuild,
  UserAddress,
  InsertUserAddress,
  Subscription,
  InsertSubscription,
  SubscriptionOrder,
  InsertSubscriptionOrder
} from "../shared/schema";

export interface IStorage {
  // PC Builds
  getPcBuilds(): Promise<PcBuild[]>;
  getPcBuildById(id: number): Promise<PcBuild | undefined>;
  getPcBuildsByCategory(category: string): Promise<PcBuild[]>;
  createPcBuild(build: InsertPcBuild): Promise<PcBuild>;
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

  // Account Linking Methods
  getUserProfilesByEmail(email: string): Promise<UserProfile[]>;
  getOrdersByEmail(email: string): Promise<Order[]>;
  getSavedBuildsByEmail(email: string): Promise<SavedBuild[]>;
  mergeUserAccounts(currentUserId: string, email: string, mergeData: {
    profiles: UserProfile[];
    orders: Order[];
    savedBuilds: SavedBuild[];
  }): Promise<void>;

  // Subscription Management
  getUserSubscriptions(userId: string): Promise<Subscription[]>;
  getAllSubscriptions(): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, subscription: Partial<InsertSubscription>): Promise<Subscription>;
  updateSubscriptionStatus(id: string, status: 'active' | 'paused' | 'cancelled' | 'expired' | 'pending'): Promise<Subscription>;
  getSubscriptionById(id: string): Promise<Subscription | undefined>;
  cancelSubscription(id: string, reason?: string): Promise<Subscription>;
  pauseSubscription(id: string): Promise<Subscription>;
  resumeSubscription(id: string): Promise<Subscription>;
  getActiveSubscriptions(): Promise<Subscription[]>;
  getSubscriptionsDueBilling(date?: Date): Promise<Subscription[]>;

  // Subscription Orders Management
  getSubscriptionOrders(subscriptionId: string): Promise<SubscriptionOrder[]>;
  getUserSubscriptionOrders(userId: string): Promise<SubscriptionOrder[]>;
  createSubscriptionOrder(order: InsertSubscriptionOrder): Promise<SubscriptionOrder>;
  updateSubscriptionOrderStatus(id: string, status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'failed'): Promise<SubscriptionOrder>;
  getSubscriptionOrderById(id: string): Promise<SubscriptionOrder | undefined>;
}

// Firebase configuration for server-side access
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate required Firebase configuration for server-side
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId || !firebaseConfig.databaseURL) {
  throw new Error('Missing required Firebase environment variables. Please set VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID, and VITE_FIREBASE_DATABASE_URL.');
}

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const database = getDatabase(app);

// Export database for direct access
export { database };

// Log Firebase configuration for debugging
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase Realtime Database Config:', {
    databaseURL: firebaseConfig.databaseURL,
    projectId: firebaseConfig.projectId,
    hasApiKey: !!firebaseConfig.apiKey
  });
}

export class FirebaseRealtimeStorage implements IStorage {
  // PC Builds
  async getPcBuilds(): Promise<PcBuild[]> {
    const snapshot = await get(ref(database, 'pcBuilds'));
    if (!snapshot.exists()) {
      console.log('No PC builds found in Firebase database');
      return [];
    }
    
    const data = snapshot.val();
    console.log('Successfully loaded data from Firebase');
    return Object.values(data).filter(Boolean) as PcBuild[];
  }


  async deleteAllPcBuilds(): Promise<void> {
    await remove(ref(database, 'pcBuilds'));
  }

  async getPcBuildById(id: number): Promise<PcBuild | undefined> {
    const snapshot = await get(ref(database, `pcBuilds/${id}`));
    return snapshot.exists() ? snapshot.val() : undefined;
  }

  async getPcBuildsByCategory(category: string): Promise<PcBuild[]> {
    const builds = await this.getPcBuilds();
    return builds.filter(build => build.category === category);
  }

  async createPcBuild(build: InsertPcBuild): Promise<PcBuild> {
    const builds = await this.getPcBuilds();
    const newId = Math.max(...builds.map(b => b.id), 0) + 1;
    
    const newBuild: PcBuild = {
      ...build,
      id: newId,
      description: build.description || undefined,
      imageUrl: build.imageUrl || undefined,
      gpu: build.gpu || undefined,
      monitor: build.monitor || undefined,
      keyboardMouse: build.keyboardMouse || undefined,
      mousePad: build.mousePad || undefined,
      stockQuantity: build.stockQuantity || 0,
      lowStockThreshold: build.lowStockThreshold || 2,
      isActive: build.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await set(ref(database, `pcBuilds/${newId}`), newBuild);
    return newBuild;
  }

  async updatePcBuild(id: number, buildData: Partial<InsertPcBuild>): Promise<PcBuild> {
    const buildRef = ref(database, `pcBuilds/${id}`);
    const snapshot = await get(buildRef);
    
    if (!snapshot.exists()) throw new Error("Build not found");
    
    const updatedData = {
      ...buildData,
      updatedAt: new Date()
    };
    
    await update(buildRef, updatedData);
    
    const updatedSnapshot = await get(buildRef);
    return updatedSnapshot.val();
  }

  async updatePcBuildStock(id: number, stockQuantity: number): Promise<PcBuild> {
    const buildRef = ref(database, `pcBuilds/${id}`);
    const snapshot = await get(buildRef);
    
    if (!snapshot.exists()) throw new Error("Build not found");
    
    const updatedData = {
      stockQuantity,
      updatedAt: new Date()
    };
    
    await update(buildRef, updatedData);
    
    const updatedSnapshot = await get(buildRef);
    return updatedSnapshot.val();
  }

  // Components
  async getComponentsByBuildId(buildId: number): Promise<Component[]> {
    const snapshot = await get(ref(database, 'components'));
    if (!snapshot.exists()) return [];
    
    const data = snapshot.val();
    return Object.values(data).filter((component: any) => component.buildId === buildId) as Component[];
  }

  async createComponent(component: InsertComponent): Promise<Component> {
    const components = await get(ref(database, 'components'));
    const existingComponents = components.exists() ? Object.values(components.val()) : [];
    const newId = Math.max(...(existingComponents as any[]).map(c => c.id || 0), 0) + 1;

    const newComponent: Component = {
      ...component,
      id: newId,
      stockQuantity: component.stockQuantity || 0,
      lowStockThreshold: component.lowStockThreshold || 5,
      isActive: component.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
      sku: component.sku || undefined
    };

    await set(ref(database, `components/${newId}`), newComponent);
    return newComponent;
  }

  async updateComponentStock(id: number, stockQuantity: number): Promise<Component> {
    const componentRef = ref(database, `components/${id}`);
    const snapshot = await get(componentRef);
    
    if (!snapshot.exists()) throw new Error("Component not found");
    
    await update(componentRef, {
      stockQuantity,
      updatedAt: new Date()
    });
    
    const updatedSnapshot = await get(componentRef);
    return updatedSnapshot.val();
  }

  // Inquiries
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const inquiries = await this.getInquiries();
    const newId = inquiries.length > 0 ? Math.max(...inquiries.map(i => i.id), 0) + 1 : 1;

    const now = new Date();
    const newInquiry: Inquiry = {
      ...inquiry,
      id: newId,
      status: inquiry.status || "pending",
      createdAt: now,
      updatedAt: now
    };

    await set(ref(database, `inquiries/${newId}`), newInquiry);
    return newInquiry;
  }

  async getInquiries(): Promise<Inquiry[]> {
    try {
      const snapshot = await get(ref(database, 'inquiries'));
      if (!snapshot.exists()) {
        console.log('No inquiries found in Firebase database');
        return [];
      }
      
      const data = snapshot.val();
      const inquiries = Object.values(data).filter(Boolean) as Inquiry[];
      
      // Backfill missing timestamps with different dates for each entry
      let backfillCount = 0;
      for (const inquiry of inquiries) {
        if (!inquiry.createdAt) {
          // Create different timestamps for each entry (going back in time)
          const fallbackDate = new Date(Date.now() - (backfillCount * 24 * 60 * 60 * 1000)); // Each entry 1 day earlier
          try {
            await update(ref(database, `inquiries/${inquiry.id}`), {
              createdAt: fallbackDate.toISOString(),
              updatedAt: fallbackDate.toISOString()
            });
            // Update the in-memory object
            (inquiry as any).createdAt = fallbackDate.toISOString();
            (inquiry as any).updatedAt = fallbackDate.toISOString();
            backfillCount++;
          } catch (updateError) {
            console.warn('Failed to backfill inquiry timestamp:', updateError);
            // Continue with existing data even if timestamp update fails
          }
        }
      }
      
      return inquiries;
    } catch (error: any) {
      // Enhanced error logging for production debugging
      console.error('Critical error fetching inquiries from Firebase:', {
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
        operation: 'getInquiries',
        stack: error.stack
      });
      
      // Check if it's a permission error specifically
      if (error.code === 'PERMISSION_DENIED') {
        console.error('⚠️ Firebase permission denied for inquiries - check security rules');
        console.warn('Production Impact: Admin panel may show empty inquiries list');
        throw new Error('Database access denied. Check Firebase security configuration.');
      }
      
      // Log specific Firebase error types for better debugging
      if (error.code === 'NETWORK_ERROR') {
        console.warn('⚠️ Firebase network connectivity issue detected');
      } else if (error.code === 'TIMEOUT') {
        console.warn('⚠️ Firebase request timeout - consider optimizing queries');
      }
      
      // Return empty array for other errors to prevent admin panel crashes
      return [];
    }
  }

  async updateInquiryStatus(id: number, status: string): Promise<Inquiry> {
    const inquiryRef = ref(database, `inquiries/${id}`);
    const snapshot = await get(inquiryRef);
    
    if (!snapshot.exists()) throw new Error("Inquiry not found");
    
    const existingInquiry = snapshot.val();
    await update(inquiryRef, {
      status,
      createdAt: existingInquiry.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    const updatedSnapshot = await get(inquiryRef);
    return updatedSnapshot.val();
  }

  async getInquiriesByStatus(status: string): Promise<Inquiry[]> {
    const inquiries = await this.getInquiries();
    return inquiries.filter(inquiry => inquiry.status === status);
  }

  // User Management
  async getUserProfile(uid: string): Promise<UserProfile | undefined> {
    const snapshot = await get(ref(database, `userProfiles/${uid}`));
    return snapshot.exists() ? snapshot.val() : undefined;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const newProfile: UserProfile = {
      ...profile,
      id: Date.now(),
      displayName: profile.displayName || undefined,
      phone: profile.phone || undefined,
      address: profile.address || undefined,
      city: profile.city || undefined,
      zipCode: profile.zipCode || undefined,
      preferences: profile.preferences || undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await set(ref(database, `userProfiles/${profile.uid}`), newProfile);
    return newProfile;
  }

  async getAllUserProfiles(): Promise<UserProfile[]> {
    try {
      const snapshot = await get(ref(database, 'userProfiles'));
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const data = snapshot.val();
      const profiles: UserProfile[] = [];
      
      for (const uid in data) {
        const profile = data[uid];
        if (profile && !profile.mergedInto) {
          profiles.push(profile);
        }
      }
      
      // Sort by creation date (newest first)
      return profiles.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('Error fetching user profiles from Firebase:', error);
      return [];
    }
  }

  async updateUserProfile(uid: string, profileUpdates: Partial<InsertUserProfile>): Promise<UserProfile> {
    const profileRef = ref(database, `userProfiles/${uid}`);
    const snapshot = await get(profileRef);
    
    if (!snapshot.exists()) throw new Error("Profile not found");
    
    const updatedData = {
      ...profileUpdates,
      updatedAt: new Date()
    };
    
    await update(profileRef, updatedData);
    
    const updatedSnapshot = await get(profileRef);
    return updatedSnapshot.val();
  }

  // Orders Management
  async getUserOrders(userId: string): Promise<Order[]> {
    const snapshot = await get(ref(database, 'orders'));
    if (!snapshot.exists()) return [];
    
    const data = snapshot.val();
    
    // Get user profile to find email address
    let userEmail = '';
    try {
      const userProfile = await this.getUserProfile(userId);
      userEmail = userProfile?.email || '';
    } catch (error) {
      // If profile not found, continue with just userId filtering
    }
    
    // Filter orders by userId OR customerEmail (for guest orders)
    const userOrders = Object.values(data).filter((order: any) => {
      const matchesUserId = order.userId === userId;
      const matchesEmail = userEmail && order.customerEmail && 
                          order.customerEmail.toLowerCase().trim() === userEmail.toLowerCase().trim();
      

      
      return matchesUserId || matchesEmail;
    }) as Order[];
    
    // Sort by ID (newest orders have higher IDs)
    return userOrders.sort((a, b) => (b.id || 0) - (a.id || 0));
  }

  async getAllOrders(): Promise<Order[]> {
    try {
      const snapshot = await get(ref(database, 'orders'));
      
      if (!snapshot.exists()) {
        console.log('No orders found in Firebase database');
        return [];
      }
      
      const data = snapshot.val();
      const orders = Object.values(data) as Order[];
      
      // Backfill missing timestamps for orders with different dates
      let orderBackfillCount = 0;
      for (const order of orders) {
        if (!order.createdAt) {
          // Create different timestamps for each order (going back in time)
          const fallbackDate = new Date(Date.now() - (orderBackfillCount * 12 * 60 * 60 * 1000)); // Each order 12 hours earlier
          try {
            await update(ref(database, `orders/${order.id}`), {
              createdAt: fallbackDate.toISOString(),
              updatedAt: fallbackDate.toISOString()
            });
            // Update the in-memory object
            (order as any).createdAt = fallbackDate.toISOString();
            (order as any).updatedAt = fallbackDate.toISOString();
            orderBackfillCount++;
          } catch (updateError) {
            console.warn('Failed to backfill order timestamp:', updateError);
            // Continue with existing data even if timestamp update fails
          }
        }
      }
      
      return orders.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    } catch (error: any) {
      console.error('Critical error fetching orders from Firebase:', error);
      
      // Check if it's a permission error specifically
      if (error.code === 'PERMISSION_DENIED') {
        console.error('Firebase permission denied for orders - check security rules');
        throw new Error('Database access denied. Check Firebase security configuration.');
      }
      
      // Return empty array for other errors to prevent admin panel crashes
      return [];
    }
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const orders = await get(ref(database, 'orders'));
    const existingOrders = orders.exists() ? Object.values(orders.val()) : [];
    const newId = Math.max(...(existingOrders as any[]).map(o => o.id || 0), 0) + 1;

    const now = new Date();
    const newOrder: Order = {
      ...order,
      id: newId,
      status: order.status || "processing",
      customerName: order.customerName || undefined,
      customerEmail: order.customerEmail || undefined,
      shippingAddress: order.shippingAddress || undefined,
      billingAddress: order.billingAddress || undefined,
      paymentMethod: order.paymentMethod || undefined,
      trackingNumber: order.trackingNumber || undefined,
      createdAt: now,
      updatedAt: now
    };

    await set(ref(database, `orders/${newId}`), newOrder);
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const orderRef = ref(database, `orders/${id}`);
    const snapshot = await get(orderRef);
    
    if (!snapshot.exists()) throw new Error("Order not found");
    
    await update(orderRef, {
      status,
      orderStatus: status,
      updatedAt: new Date()
    });
    
    const updatedSnapshot = await get(orderRef);
    return updatedSnapshot.val();
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const snapshot = await get(ref(database, `orders/${id}`));
    return snapshot.exists() ? snapshot.val() : undefined;
  }

  async clearAllOrders(): Promise<void> {
    await remove(ref(database, 'orders'));
  }

  async clearAllInquiries(): Promise<void> {
    await remove(ref(database, 'inquiries'));
  }

  // Saved Builds Management
  async getUserSavedBuilds(userId: string): Promise<SavedBuild[]> {
    const snapshot = await get(ref(database, `savedBuilds/${userId}`));
    if (!snapshot.exists()) return [];
    
    const data = snapshot.val();
    return Object.values(data) as SavedBuild[];
  }

  async saveUserBuild(savedBuild: InsertSavedBuild): Promise<SavedBuild> {
    const newSavedBuild: SavedBuild = {
      ...savedBuild,
      id: Date.now(),
      savedAt: new Date()
    };

    const userBuildsRef = ref(database, `savedBuilds/${savedBuild.userId}`);
    const snapshot = await get(userBuildsRef);
    
    const existingBuilds = snapshot.exists() ? snapshot.val() : {};
    existingBuilds[newSavedBuild.id] = newSavedBuild;
    
    await set(userBuildsRef, existingBuilds);
    return newSavedBuild;
  }

  async removeSavedBuild(userId: string, buildId: number): Promise<void> {
    const userBuilds = await this.getUserSavedBuilds(userId);
    const buildToRemove = userBuilds.find(build => build.buildId === buildId);
    
    if (buildToRemove) {
      await remove(ref(database, `savedBuilds/${userId}/${buildToRemove.id}`));
    }
  }

  // Inventory Management
  async getLowStockItems(): Promise<{builds: PcBuild[], components: Component[]}> {
    const builds = await this.getPcBuilds();
    const components = await get(ref(database, 'components'));
    
    const lowStockBuilds = builds.filter(build => 
      build.stockQuantity <= build.lowStockThreshold
    );
    
    const allComponents = components.exists() ? Object.values(components.val()) as Component[] : [];
    const lowStockComponents = allComponents.filter(component => 
      component.stockQuantity <= component.lowStockThreshold
    );
    
    return { builds: lowStockBuilds, components: lowStockComponents };
  }

  async getStockMovements(itemId?: number, itemType?: 'build' | 'component'): Promise<any[]> {
    const snapshot = await get(ref(database, 'stockMovements'));
    if (!snapshot.exists()) return [];
    
    let movements = Object.values(snapshot.val());
    
    if (itemId && itemType) {
      movements = movements.filter((movement: any) => 
        movement.itemId === itemId && movement.itemType === itemType
      );
    }
    
    return movements;
  }

  async createStockMovement(movement: any): Promise<any> {
    const newMovement = {
      ...movement,
      id: Date.now(),
      createdAt: new Date()
    };

    await set(ref(database, `stockMovements/${newMovement.id}`), newMovement);
    return newMovement;
  }

  async getStockAlerts(): Promise<any[]> {
    const snapshot = await get(ref(database, 'stockAlerts'));
    if (!snapshot.exists()) return [];
    
    return Object.values(snapshot.val());
  }

  async resolveStockAlert(alertId: number): Promise<void> {
    await remove(ref(database, `stockAlerts/${alertId}`));
  }

  // Address Management Methods
  async getUserAddresses(userId: string): Promise<UserAddress[]> {
    const snapshot = await get(ref(database, `userAddresses/${userId}`));
    if (!snapshot.exists()) return [];
    
    const data = snapshot.val();
    return Object.values(data).filter(Boolean) as UserAddress[];
  }

  async saveUserAddress(address: InsertUserAddress): Promise<UserAddress> {
    const addressId = Date.now().toString();
    const newAddress: UserAddress = {
      ...address,
      id: addressId,
      createdAt: new Date(),
      isDefault: address.isDefault ?? false
    };

    // If this is set as default, unset other default addresses for this user
    if (address.isDefault) {
      const existingAddresses = await this.getUserAddresses(address.userId);
      for (const existingAddress of existingAddresses) {
        if (existingAddress.isDefault) {
          await update(ref(database, `userAddresses/${address.userId}/${existingAddress.id}`), {
            isDefault: false
          });
        }
      }
    }

    await set(ref(database, `userAddresses/${address.userId}/${addressId}`), newAddress);
    return newAddress;
  }

  async updateUserAddress(addressId: string, addressUpdates: Partial<InsertUserAddress>): Promise<UserAddress> {
    // Find the address to get userId
    const allUsersSnapshot = await get(ref(database, 'userAddresses'));
    let userId = '';
    let currentAddress: UserAddress | null = null;

    if (allUsersSnapshot.exists()) {
      const allUsers = allUsersSnapshot.val();
      for (const uid in allUsers) {
        const userAddresses = allUsers[uid];
        if (userAddresses[addressId]) {
          userId = uid;
          currentAddress = userAddresses[addressId];
          break;
        }
      }
    }

    if (!currentAddress || !userId) {
      throw new Error('Address not found');
    }

    // If setting as default, unset other default addresses
    if (addressUpdates.isDefault) {
      const existingAddresses = await this.getUserAddresses(userId);
      for (const existingAddress of existingAddresses) {
        if (existingAddress.isDefault && existingAddress.id !== addressId) {
          await update(ref(database, `userAddresses/${userId}/${existingAddress.id}`), {
            isDefault: false
          });
        }
      }
    }

    const updatedAddress = { ...currentAddress, ...addressUpdates };
    await update(ref(database, `userAddresses/${userId}/${addressId}`), updatedAddress);
    return updatedAddress;
  }

  async deleteUserAddress(addressId: string): Promise<void> {
    // Find the address to get userId
    const allUsersSnapshot = await get(ref(database, 'userAddresses'));
    let userId = '';

    if (allUsersSnapshot.exists()) {
      const allUsers = allUsersSnapshot.val();
      for (const uid in allUsers) {
        const userAddresses = allUsers[uid];
        if (userAddresses[addressId]) {
          userId = uid;
          break;
        }
      }
    }

    if (userId) {
      await remove(ref(database, `userAddresses/${userId}/${addressId}`));
    }
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    // Unset all default addresses for this user
    const existingAddresses = await this.getUserAddresses(userId);
    for (const address of existingAddresses) {
      await update(ref(database, `userAddresses/${userId}/${address.id}`), {
        isDefault: false
      });
    }

    // Set the specified address as default
    await update(ref(database, `userAddresses/${userId}/${addressId}`), {
      isDefault: true
    });
  }

  // Account Linking Methods Implementation
  async getUserProfilesByEmail(email: string): Promise<UserProfile[]> {
    const snapshot = await get(ref(database, 'userProfiles'));
    if (!snapshot.exists()) return [];
    
    const data = snapshot.val();
    const profiles: UserProfile[] = [];
    
    for (const uid in data) {
      const profile = data[uid];
      if (profile && profile.email === email) {
        profiles.push(profile);
      }
    }
    
    return profiles;
  }

  async getOrdersByEmail(email: string): Promise<Order[]> {
    const allOrders = await this.getAllOrders();
    return allOrders.filter(order => 
      order.customerEmail?.toLowerCase() === email.toLowerCase()
    );
  }

  async getSavedBuildsByEmail(email: string): Promise<SavedBuild[]> {
    // First get all user profiles with this email to find their user IDs
    const profiles = await this.getUserProfilesByEmail(email);
    const userIds = profiles.map(profile => profile.uid);
    
    const snapshot = await get(ref(database, 'savedBuilds'));
    if (!snapshot.exists()) return [];
    
    const data = snapshot.val();
    const savedBuilds: SavedBuild[] = [];
    
    for (const uid in data) {
      if (userIds.includes(uid)) {
        const userBuilds = data[uid];
        if (userBuilds) {
          Object.values(userBuilds).forEach((build: any) => {
            if (build) savedBuilds.push(build);
          });
        }
      }
    }
    
    return savedBuilds;
  }

  async mergeUserAccounts(currentUserId: string, email: string, mergeData: {
    profiles: UserProfile[];
    orders: Order[];
    savedBuilds: SavedBuild[];
  }): Promise<void> {
    try {
      // 1. Create or update primary user profile
      const primaryProfile = mergeData.profiles.find(p => p.uid === currentUserId) || mergeData.profiles[0];
      if (primaryProfile) {
        // Merge profile data, keeping most complete information
        const mergedProfile = {
          ...primaryProfile,
          uid: currentUserId,
          email: email,
          // Merge additional fields from other profiles
          displayName: primaryProfile.displayName || mergeData.profiles.find(p => p.displayName)?.displayName,
          phone: primaryProfile.phone || mergeData.profiles.find(p => p.phone)?.phone,
          address: primaryProfile.address || mergeData.profiles.find(p => p.address)?.address,
          city: primaryProfile.city || mergeData.profiles.find(p => p.city)?.city,
          zipCode: primaryProfile.zipCode || mergeData.profiles.find(p => p.zipCode)?.zipCode,
          updatedAt: new Date()
        };
        
        await set(ref(database, `userProfiles/${currentUserId}`), mergedProfile);
      }

      // 2. Update all orders to use current user ID
      for (const order of mergeData.orders) {
        if (order.userId !== currentUserId) {
          const updatedOrder = {
            ...order,
            userId: currentUserId,
            updatedAt: new Date()
          };
          await update(ref(database, `orders/${order.id}`), updatedOrder);
        }
      }

      // 3. Merge saved builds under current user ID
      const existingSavedBuilds = await this.getUserSavedBuilds(currentUserId);
      const existingBuildIds = existingSavedBuilds.map(sb => sb.buildId);
      
      for (const savedBuild of mergeData.savedBuilds) {
        if (savedBuild.userId !== currentUserId && !existingBuildIds.includes(savedBuild.buildId)) {
          const newSavedBuild = {
            ...savedBuild,
            userId: currentUserId,
            id: Date.now() + Math.random(), // Generate new ID
            savedAt: new Date()
          };
          await set(ref(database, `savedBuilds/${currentUserId}/${newSavedBuild.id}`), newSavedBuild);
        }
      }

      // 4. Clean up old profile entries (but keep the data for safety)
      // We'll just mark them as merged rather than delete
      for (const profile of mergeData.profiles) {
        if (profile.uid !== currentUserId) {
          await update(ref(database, `userProfiles/${profile.uid}`), {
            mergedInto: currentUserId,
            mergedAt: new Date(),
            originalEmail: email
          });
        }
      }

      console.log(`Successfully merged accounts for email: ${email} into user: ${currentUserId}`);
    } catch (error) {
      console.error('Error merging user accounts:', error);
      throw error;
    }
  }

  // Admin Settings Methods (simplified - no Firebase access)
  async getAdminSetting(key: string): Promise<any> {
    // Return default values for maintenance mode without Firebase access
    if (key === 'maintenanceMode') {
      return {
        key: 'maintenanceMode',
        value: false,
        updatedAt: new Date()
      };
    }
    return null;
  }

  async setAdminSetting(key: string, value: string): Promise<any> {
    // Return setting object without storing in Firebase
    return {
      key,
      value,
      updatedAt: new Date()
    };
  }

  async getAllAdminSettings(): Promise<any[]> {
    // Return empty array - admin settings not implemented in Firebase
    return [];
  }

  // Subscription Management Methods
  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    const snapshot = await get(ref(database, `subscriptions`));
    if (!snapshot.exists()) return [];
    
    const allSubscriptions = snapshot.val();
    const userSubscriptions: Subscription[] = [];
    
    for (const subscriptionId in allSubscriptions) {
      const subscription = allSubscriptions[subscriptionId];
      if (subscription && subscription.userId === userId) {
        userSubscriptions.push(subscription);
      }
    }
    
    return userSubscriptions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }


  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate billing dates
    const now = new Date();
    const currentPeriodStart = now;
    let currentPeriodEnd: Date;
    let nextBillingDate: Date;
    
    switch (subscription.billingCycle) {
      case 'monthly':
        currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        nextBillingDate = currentPeriodEnd;
        break;
      case 'quarterly':
        currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
        nextBillingDate = currentPeriodEnd;
        break;
      case 'yearly':
        currentPeriodEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        nextBillingDate = currentPeriodEnd;
        break;
    }
    
    const newSubscription: Subscription = {
      ...subscription,
      id: subscriptionId,
      currentPeriodStart,
      currentPeriodEnd,
      nextBillingDate,
      totalDelivered: 0,
      successfulPayments: 0,
      failedPayments: 0,
      createdAt: now,
      updatedAt: now
    };

    await set(ref(database, `subscriptions/${subscriptionId}`), newSubscription);
    return newSubscription;
  }

  async updateSubscription(id: string, subscription: Partial<InsertSubscription>): Promise<Subscription> {
    const subscriptionRef = ref(database, `subscriptions/${id}`);
    const snapshot = await get(subscriptionRef);
    
    if (!snapshot.exists()) {
      throw new Error("Subscription not found");
    }
    
    const updatedData = {
      ...subscription,
      updatedAt: new Date()
    };
    
    await update(subscriptionRef, updatedData);
    
    const updatedSnapshot = await get(subscriptionRef);
    return updatedSnapshot.val();
  }

  async updateSubscriptionStatus(id: string, status: 'active' | 'paused' | 'cancelled' | 'expired' | 'pending'): Promise<Subscription> {
    const subscriptionRef = ref(database, `subscriptions/${id}`);
    const snapshot = await get(subscriptionRef);
    
    if (!snapshot.exists()) {
      throw new Error("Subscription not found");
    }
    
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    if (status === 'cancelled') {
      updateData.cancelledAt = new Date();
    }
    
    await update(subscriptionRef, updateData);
    
    const updatedSnapshot = await get(subscriptionRef);
    return updatedSnapshot.val();
  }

  async getSubscriptionById(id: string): Promise<Subscription | undefined> {
    const snapshot = await get(ref(database, `subscriptions/${id}`));
    return snapshot.exists() ? snapshot.val() : undefined;
  }

  async cancelSubscription(id: string, reason?: string): Promise<Subscription> {
    const subscriptionRef = ref(database, `subscriptions/${id}`);
    const snapshot = await get(subscriptionRef);
    
    if (!snapshot.exists()) {
      throw new Error("Subscription not found");
    }
    
    const updateData = {
      status: 'cancelled' as const,
      cancelledAt: new Date(),
      cancellationReason: reason,
      updatedAt: new Date()
    };
    
    await update(subscriptionRef, updateData);
    
    const updatedSnapshot = await get(subscriptionRef);
    return updatedSnapshot.val();
  }

  async pauseSubscription(id: string): Promise<Subscription> {
    return this.updateSubscriptionStatus(id, 'paused');
  }

  async resumeSubscription(id: string): Promise<Subscription> {
    const subscriptionRef = ref(database, `subscriptions/${id}`);
    const snapshot = await get(subscriptionRef);
    
    if (!snapshot.exists()) {
      throw new Error("Subscription not found");
    }
    
    const subscription = snapshot.val();
    
    // Calculate new billing dates when resuming
    const now = new Date();
    let nextBillingDate: Date;
    
    switch (subscription.billingCycle) {
      case 'monthly':
        nextBillingDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        break;
      case 'quarterly':
        nextBillingDate = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
        break;
      case 'yearly':
        nextBillingDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        break;
      default:
        nextBillingDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        break;
    }
    
    const updateData = {
      status: 'active' as const,
      nextBillingDate,
      currentPeriodStart: now,
      currentPeriodEnd: nextBillingDate,
      updatedAt: new Date()
    };
    
    await update(subscriptionRef, updateData);
    
    const updatedSnapshot = await get(subscriptionRef);
    return updatedSnapshot.val();
  }

  async getActiveSubscriptions(): Promise<Subscription[]> {
    const allSubscriptions = await this.getAllSubscriptions();
    return allSubscriptions.filter(sub => sub.status === 'active');
  }

  async getSubscriptionsDueBilling(date?: Date): Promise<Subscription[]> {
    const targetDate = date || new Date();
    const allSubscriptions = await this.getAllSubscriptions();
    
    return allSubscriptions.filter(sub => 
      sub.status === 'active' && 
      new Date(sub.nextBillingDate) <= targetDate
    );
  }

  // Subscription Orders Management Methods
  async getSubscriptionOrders(subscriptionId: string): Promise<SubscriptionOrder[]> {
    const snapshot = await get(ref(database, `subscriptionOrders`));
    if (!snapshot.exists()) return [];
    
    const allOrders = snapshot.val();
    const subscriptionOrders: SubscriptionOrder[] = [];
    
    for (const orderId in allOrders) {
      const order = allOrders[orderId];
      if (order && order.subscriptionId === subscriptionId) {
        subscriptionOrders.push(order);
      }
    }
    
    return subscriptionOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getUserSubscriptionOrders(userId: string): Promise<SubscriptionOrder[]> {
    const snapshot = await get(ref(database, `subscriptionOrders`));
    if (!snapshot.exists()) return [];
    
    const allOrders = snapshot.val();
    const userOrders: SubscriptionOrder[] = [];
    
    for (const orderId in allOrders) {
      const order = allOrders[orderId];
      if (order && order.userId === userId) {
        userOrders.push(order);
      }
    }
    
    return userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createSubscriptionOrder(order: InsertSubscriptionOrder): Promise<SubscriptionOrder> {
    const orderId = `sub_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newOrder: SubscriptionOrder = {
      ...order,
      id: orderId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await set(ref(database, `subscriptionOrders/${orderId}`), newOrder);
    return newOrder;
  }

  async updateSubscriptionOrderStatus(id: string, status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'failed'): Promise<SubscriptionOrder> {
    const orderRef = ref(database, `subscriptionOrders/${id}`);
    const snapshot = await get(orderRef);
    
    if (!snapshot.exists()) {
      throw new Error("Subscription order not found");
    }
    
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    if (status === 'delivered') {
      updateData.deliveryDate = new Date();
    }
    
    await update(orderRef, updateData);
    
    const updatedSnapshot = await get(orderRef);
    return updatedSnapshot.val();
  }

  async getSubscriptionOrderById(id: string): Promise<SubscriptionOrder | undefined> {
    const snapshot = await get(ref(database, `subscriptionOrders/${id}`));
    return snapshot.exists() ? snapshot.val() : undefined;
  }

  // Admin method to get all subscriptions
  async getAllSubscriptions(): Promise<Subscription[]> {
    try {
      const snapshot = await get(ref(database, 'subscriptions'));
      const subscriptions = snapshot.val() || {};
      
      return Object.entries(subscriptions)
        .map(([id, subscription]: [string, any]) => ({ id, ...subscription }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error: any) {
      console.error('Error fetching all subscriptions:', error);
      
      // Check if it's a permission error specifically
      if (error.code === 'PERMISSION_DENIED') {
        console.warn('⚠️ Firebase permission denied for subscriptions - this is expected if no subscriptions exist yet');
        return [];
      }
      
      // For other errors, return empty array to prevent admin panel crashes
      return [];
    }
  }

  // Admin method to get all subscription orders
  async getAllSubscriptionOrders(): Promise<SubscriptionOrder[]> {
    try {
      const snapshot = await get(ref(database, 'subscriptionOrders'));
      const orders = snapshot.val() || {};
      
      return Object.entries(orders)
        .map(([id, order]: [string, any]) => ({ id, ...order }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching all subscription orders:', error);
      throw error;
    }
  }
}

export const firebaseRealtimeStorage = new FirebaseRealtimeStorage();