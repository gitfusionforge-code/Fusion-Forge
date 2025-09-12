import type { IStorage } from '../firebase-realtime-storage';
import { FirebaseRealtimeStorage } from '../firebase-realtime-storage';
import { PrismaStorage } from './prisma-storage';

// Environment configuration for storage driver selection
const STORAGE_DRIVER = process.env.STORAGE_DRIVER || 'firebase'; // 'firebase' | 'prisma'
const STORAGE_DUAL_WRITE = process.env.STORAGE_DUAL_WRITE === 'true';

// Per-entity read configuration
const STORAGE_READ_PC_BUILDS = process.env.STORAGE_READ_PC_BUILDS || STORAGE_DRIVER;
const STORAGE_READ_ORDERS = process.env.STORAGE_READ_ORDERS || STORAGE_DRIVER;
const STORAGE_READ_USER_PROFILES = process.env.STORAGE_READ_USER_PROFILES || STORAGE_DRIVER;
const STORAGE_READ_INQUIRIES = process.env.STORAGE_READ_INQUIRIES || STORAGE_DRIVER;
const STORAGE_READ_COMPONENTS = process.env.STORAGE_READ_COMPONENTS || STORAGE_DRIVER;

console.log('🔧 Storage Configuration:', {
  driver: STORAGE_DRIVER,
  dualWrite: STORAGE_DUAL_WRITE,
  readConfig: {
    pcBuilds: STORAGE_READ_PC_BUILDS,
    orders: STORAGE_READ_ORDERS,
    userProfiles: STORAGE_READ_USER_PROFILES,
    inquiries: STORAGE_READ_INQUIRIES,
    components: STORAGE_READ_COMPONENTS
  }
});

/**
 * Dual-Write Storage Wrapper
 * Writes to both Firebase and Prisma when dual-write is enabled
 * Reads from the configured primary source per entity
 */
class DualWriteStorage implements IStorage {
  private firebaseStorage: FirebaseRealtimeStorage;
  private prismaStorage: PrismaStorage;

  constructor() {
    this.firebaseStorage = new FirebaseRealtimeStorage();
    this.prismaStorage = new PrismaStorage();
  }

  // PC Builds Management
  async getPcBuilds() {
    const source = STORAGE_READ_PC_BUILDS === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getPcBuilds();
  }

  async getPcBuildById(id: number) {
    const source = STORAGE_READ_PC_BUILDS === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getPcBuildById(id);
  }

  async getPcBuildsByCategory(category: string) {
    const source = STORAGE_READ_PC_BUILDS === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getPcBuildsByCategory(category);
  }

  async createPcBuild(build: any) {
    if (STORAGE_DUAL_WRITE) {
      // Write to both, but return from primary
      const [firebaseResult, prismaResult] = await Promise.allSettled([
        this.firebaseStorage.createPcBuild(build),
        this.prismaStorage.createPcBuild(build)
      ]);
      
      console.log('📝 Dual-write PcBuild:', {
        firebase: firebaseResult.status,
        prisma: prismaResult.status
      });
      
      // Return from the read source
      const source = STORAGE_READ_PC_BUILDS === 'prisma' ? this.prismaStorage : this.firebaseStorage;
      return source.getPcBuildById((firebaseResult.status === 'fulfilled' ? firebaseResult.value.id : (prismaResult as any).value.id));
    } else {
      // Single write
      const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
      return source.createPcBuild(build);
    }
  }

  async updatePcBuild(id: number, buildData: any) {
    if (STORAGE_DUAL_WRITE) {
      const [firebaseResult, prismaResult] = await Promise.allSettled([
        this.firebaseStorage.updatePcBuild(id, buildData),
        this.prismaStorage.updatePcBuild(id, buildData)
      ]);
      
      console.log('📝 Dual-write PcBuild update:', {
        firebase: firebaseResult.status,
        prisma: prismaResult.status
      });
    }
    
    const source = STORAGE_READ_PC_BUILDS === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.updatePcBuild(id, buildData);
  }

  async updatePcBuildStock(id: number, stockQuantity: number) {
    if (STORAGE_DUAL_WRITE) {
      const [firebaseResult, prismaResult] = await Promise.allSettled([
        this.firebaseStorage.updatePcBuildStock(id, stockQuantity),
        this.prismaStorage.updatePcBuildStock(id, stockQuantity)
      ]);
      
      console.log('📝 Dual-write PcBuild stock:', {
        firebase: firebaseResult.status,
        prisma: prismaResult.status
      });
    }
    
    const source = STORAGE_READ_PC_BUILDS === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.updatePcBuildStock(id, stockQuantity);
  }

  async deleteAllPcBuilds() {
    if (STORAGE_DUAL_WRITE) {
      await Promise.allSettled([
        this.firebaseStorage.deleteAllPcBuilds(),
        this.prismaStorage.deleteAllPcBuilds()
      ]);
    } else {
      const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
      return source.deleteAllPcBuilds();
    }
  }

  // Components Management
  async getComponents() {
    const source = STORAGE_READ_COMPONENTS === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getComponents();
  }

  async getComponentById(id: number) {
    const source = STORAGE_READ_COMPONENTS === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getComponentById(id);
  }

  async createComponent(component: any) {
    if (STORAGE_DUAL_WRITE) {
      const [firebaseResult, prismaResult] = await Promise.allSettled([
        this.firebaseStorage.createComponent(component),
        this.prismaStorage.createComponent(component)
      ]);
      
      console.log('📝 Dual-write Component:', {
        firebase: firebaseResult.status,
        prisma: prismaResult.status
      });
    }
    
    const source = STORAGE_READ_COMPONENTS === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.createComponent(component);
  }

  async updateComponent(id: number, componentData: any) {
    if (STORAGE_DUAL_WRITE) {
      await Promise.allSettled([
        this.firebaseStorage.updateComponent(id, componentData),
        this.prismaStorage.updateComponent(id, componentData)
      ]);
    }
    
    const source = STORAGE_READ_COMPONENTS === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.updateComponent(id, componentData);
  }

  async deleteComponent(id: number) {
    if (STORAGE_DUAL_WRITE) {
      await Promise.allSettled([
        this.firebaseStorage.deleteComponent(id),
        this.prismaStorage.deleteComponent(id)
      ]);
    } else {
      const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
      return source.deleteComponent(id);
    }
  }

  // User Management
  async getUserProfile(uid: string) {
    const source = STORAGE_READ_USER_PROFILES === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getUserProfile(uid);
  }

  async createUserProfile(profile: any) {
    if (STORAGE_DUAL_WRITE) {
      const [firebaseResult, prismaResult] = await Promise.allSettled([
        this.firebaseStorage.createUserProfile(profile),
        this.prismaStorage.createUserProfile(profile)
      ]);
      
      console.log('📝 Dual-write UserProfile:', {
        firebase: firebaseResult.status,
        prisma: prismaResult.status
      });
    }
    
    const source = STORAGE_READ_USER_PROFILES === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.createUserProfile(profile);
  }

  async updateUserProfile(uid: string, profileUpdates: any) {
    if (STORAGE_DUAL_WRITE) {
      await Promise.allSettled([
        this.firebaseStorage.updateUserProfile(uid, profileUpdates),
        this.prismaStorage.updateUserProfile(uid, profileUpdates)
      ]);
    }
    
    const source = STORAGE_READ_USER_PROFILES === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.updateUserProfile(uid, profileUpdates);
  }

  async getAllUserProfiles() {
    const source = STORAGE_READ_USER_PROFILES === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getAllUserProfiles();
  }

  // Orders Management
  async getUserOrders(userId: string) {
    const source = STORAGE_READ_ORDERS === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getUserOrders(userId);
  }

  async getAllOrders() {
    const source = STORAGE_READ_ORDERS === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getAllOrders();
  }

  async createOrder(order: any) {
    if (STORAGE_DUAL_WRITE) {
      const [firebaseResult, prismaResult] = await Promise.allSettled([
        this.firebaseStorage.createOrder(order),
        this.prismaStorage.createOrder(order)
      ]);
      
      console.log('📝 Dual-write Order:', {
        firebase: firebaseResult.status,
        prisma: prismaResult.status
      });
    }
    
    const source = STORAGE_READ_ORDERS === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.createOrder(order);
  }

  async updateOrderStatus(id: number, status: string) {
    if (STORAGE_DUAL_WRITE) {
      await Promise.allSettled([
        this.firebaseStorage.updateOrderStatus(id, status),
        this.prismaStorage.updateOrderStatus(id, status)
      ]);
    }
    
    const source = STORAGE_READ_ORDERS === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.updateOrderStatus(id, status);
  }

  // Inquiries Management
  async getInquiries() {
    const source = STORAGE_READ_INQUIRIES === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getInquiries();
  }

  async createInquiry(inquiry: any) {
    if (STORAGE_DUAL_WRITE) {
      const [firebaseResult, prismaResult] = await Promise.allSettled([
        this.firebaseStorage.createInquiry(inquiry),
        this.prismaStorage.createInquiry(inquiry)
      ]);
      
      console.log('📝 Dual-write Inquiry:', {
        firebase: firebaseResult.status,
        prisma: prismaResult.status
      });
    }
    
    const source = STORAGE_READ_INQUIRIES === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.createInquiry(inquiry);
  }

  async updateInquiryStatus(id: number, status: string) {
    if (STORAGE_DUAL_WRITE) {
      await Promise.allSettled([
        this.firebaseStorage.updateInquiryStatus(id, status),
        this.prismaStorage.updateInquiryStatus(id, status)
      ]);
    }
    
    const source = STORAGE_READ_INQUIRIES === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.updateInquiryStatus(id, status);
  }

  async getInquiriesByStatus(status: string) {
    const source = STORAGE_READ_INQUIRIES === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getInquiriesByStatus(status);
  }

  // Delegate all other methods to the primary storage for now
  async getUserSavedBuilds(userId: string) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getUserSavedBuilds(userId);
  }

  async saveUserBuild(userId: string, buildId: number) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.saveUserBuild(userId, buildId);
  }

  async removeSavedBuild(userId: string, buildId: number) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.removeSavedBuild(userId, buildId);
  }

  async getUserAddresses(userId: string) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getUserAddresses(userId);
  }

  async saveUserAddress(address: any) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.saveUserAddress(address);
  }

  async updateUserAddress(addressId: string, address: any) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.updateUserAddress(addressId, address);
  }

  async deleteUserAddress(addressId: string) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.deleteUserAddress(addressId);
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.setDefaultAddress(userId, addressId);
  }

  async getUserProfilesByEmail(email: string) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getUserProfilesByEmail(email);
  }

  async getOrdersByEmail(email: string) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getOrdersByEmail(email);
  }

  async getSavedBuildsByEmail(email: string) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getSavedBuildsByEmail(email);
  }

  async mergeUserAccounts(currentUserId: string, email: string, mergeData: any) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.mergeUserAccounts(currentUserId, email, mergeData);
  }

  async getUserSubscriptions(userId: string) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getUserSubscriptions(userId);
  }

  async getAllSubscriptions() {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getAllSubscriptions();
  }

  async createSubscription(subscription: any) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.createSubscription(subscription);
  }

  async updateSubscription(id: string, subscription: any) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.updateSubscription(id, subscription);
  }

  async updateSubscriptionStatus(id: string, status: any) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.updateSubscriptionStatus(id, status);
  }

  async getSubscriptionById(id: string) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getSubscriptionById(id);
  }

  async cancelSubscription(id: string, reason?: string) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.cancelSubscription(id, reason);
  }

  async pauseSubscription(id: string) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.pauseSubscription(id);
  }

  async resumeSubscription(id: string) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.resumeSubscription(id);
  }

  async getActiveSubscriptions() {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getActiveSubscriptions();
  }

  async getSubscriptionsDueBilling(date?: Date) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getSubscriptionsDueBilling(date);
  }

  async getSubscriptionOrders(subscriptionId: string) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getSubscriptionOrders(subscriptionId);
  }

  async getUserSubscriptionOrders(userId: string) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getUserSubscriptionOrders(userId);
  }

  async createSubscriptionOrder(order: any) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.createSubscriptionOrder(order);
  }

  async updateSubscriptionOrderStatus(id: string, status: any) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.updateSubscriptionOrderStatus(id, status);
  }

  async getSubscriptionOrderById(id: string) {
    const source = STORAGE_DRIVER === 'prisma' ? this.prismaStorage : this.firebaseStorage;
    return source.getSubscriptionOrderById(id);
  }
}

// Create and export the storage instance
function createStorage(): IStorage {
  if (STORAGE_DUAL_WRITE || STORAGE_DRIVER === 'prisma') {
    return new DualWriteStorage();
  } else {
    return new FirebaseRealtimeStorage();
  }
}

export const storage = createStorage();