import { PrismaClient } from '../../generated/prisma';
import type { IStorage } from '../firebase-realtime-storage';
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
  AdminSetting,
  InsertAdminSetting,
  Subscription,
  InsertSubscription,
  SubscriptionOrder,
  InsertSubscriptionOrder
} from '../../shared/schema';

const prisma = new PrismaClient();

export class PrismaStorage implements IStorage {
  
  // PC Builds Management
  async getPcBuilds(): Promise<PcBuild[]> {
    const builds = await prisma.pcBuild.findMany({
      orderBy: { id: 'asc' }
    });
    return builds.map(this.mapPcBuildFromPrisma);
  }

  async getPcBuildById(id: number): Promise<PcBuild | undefined> {
    const build = await prisma.pcBuild.findUnique({
      where: { id }
    });
    return build ? this.mapPcBuildFromPrisma(build) : undefined;
  }

  async getPcBuildsByCategory(category: string): Promise<PcBuild[]> {
    const builds = await prisma.pcBuild.findMany({
      where: { category },
      orderBy: { id: 'asc' }
    });
    return builds.map(this.mapPcBuildFromPrisma);
  }

  async createPcBuild(build: InsertPcBuild): Promise<PcBuild> {
    // Get next ID manually to preserve Firebase compatibility
    const lastBuild = await prisma.pcBuild.findFirst({
      orderBy: { id: 'desc' }
    });
    const newId = (lastBuild?.id || 0) + 1;

    const created = await prisma.pcBuild.create({
      data: {
        id: newId,
        ...build,
        stockQuantity: build.stockQuantity || 0,
        lowStockThreshold: build.lowStockThreshold || 2,
        isActive: build.isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    return this.mapPcBuildFromPrisma(created);
  }

  async updatePcBuild(id: number, buildData: Partial<InsertPcBuild>): Promise<PcBuild> {
    const updated = await prisma.pcBuild.update({
      where: { id },
      data: {
        ...buildData,
        updatedAt: new Date()
      }
    });
    return this.mapPcBuildFromPrisma(updated);
  }

  async updatePcBuildStock(id: number, stockQuantity: number): Promise<PcBuild> {
    const updated = await prisma.pcBuild.update({
      where: { id },
      data: {
        stockQuantity,
        updatedAt: new Date()
      }
    });
    return this.mapPcBuildFromPrisma(updated);
  }

  async deleteAllPcBuilds(): Promise<void> {
    await prisma.pcBuild.deleteMany();
  }

  // Components Management  
  async getComponents(): Promise<Component[]> {
    const components = await prisma.component.findMany({
      orderBy: { id: 'asc' }
    });
    return components.map(this.mapComponentFromPrisma);
  }

  async getComponentById(id: number): Promise<Component | undefined> {
    const component = await prisma.component.findUnique({
      where: { id }
    });
    return component ? this.mapComponentFromPrisma(component) : undefined;
  }

  async createComponent(component: InsertComponent): Promise<Component> {
    const lastComponent = await prisma.component.findFirst({
      orderBy: { id: 'desc' }
    });
    const newId = (lastComponent?.id || 0) + 1;

    const created = await prisma.component.create({
      data: {
        id: newId,
        ...component,
        stockQuantity: component.stockQuantity || 0,
        lowStockThreshold: component.lowStockThreshold || 5,
        isActive: component.isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    return this.mapComponentFromPrisma(created);
  }

  async updateComponent(id: number, componentData: Partial<InsertComponent>): Promise<Component> {
    const updated = await prisma.component.update({
      where: { id },
      data: {
        ...componentData,
        updatedAt: new Date()
      }
    });
    return this.mapComponentFromPrisma(updated);
  }

  async deleteComponent(id: number): Promise<void> {
    await prisma.component.delete({
      where: { id }
    });
  }

  // Inquiries Management
  async getInquiries(): Promise<Inquiry[]> {
    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return inquiries.map(this.mapInquiryFromPrisma);
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const lastInquiry = await prisma.inquiry.findFirst({
      orderBy: { id: 'desc' }
    });
    const newId = (lastInquiry?.id || 0) + 1;

    const created = await prisma.inquiry.create({
      data: {
        id: newId,
        ...inquiry,
        status: inquiry.status || 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    return this.mapInquiryFromPrisma(created);
  }

  async updateInquiryStatus(id: number, status: string): Promise<Inquiry> {
    const updated = await prisma.inquiry.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date()
      }
    });
    return this.mapInquiryFromPrisma(updated);
  }

  async getInquiriesByStatus(status: string): Promise<Inquiry[]> {
    const inquiries = await prisma.inquiry.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' }
    });
    return inquiries.map(this.mapInquiryFromPrisma);
  }

  // User Management
  async getUserProfile(uid: string): Promise<UserProfile | undefined> {
    const profile = await prisma.userProfile.findUnique({
      where: { uid }
    });
    return profile ? this.mapUserProfileFromPrisma(profile) : undefined;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const lastProfile = await prisma.userProfile.findFirst({
      orderBy: { id: 'desc' }
    });
    const newId = (lastProfile?.id || 0) + 1;

    const created = await prisma.userProfile.create({
      data: {
        id: newId,
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    return this.mapUserProfileFromPrisma(created);
  }

  async updateUserProfile(uid: string, profileUpdates: Partial<InsertUserProfile>): Promise<UserProfile> {
    const updated = await prisma.userProfile.update({
      where: { uid },
      data: {
        ...profileUpdates,
        updatedAt: new Date()
      }
    });
    return this.mapUserProfileFromPrisma(updated);
  }

  async getAllUserProfiles(): Promise<UserProfile[]> {
    const profiles = await prisma.userProfile.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return profiles.map(this.mapUserProfileFromPrisma);
  }

  // Orders Management
  async getUserOrders(userId: string): Promise<Order[]> {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { userId },
          { customerEmail: { not: null } } // Will need to filter by email separately
        ]
      },
      orderBy: { id: 'desc' }
    });
    return orders.map(this.mapOrderFromPrisma);
  }

  async getAllOrders(): Promise<Order[]> {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return orders.map(this.mapOrderFromPrisma);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const lastOrder = await prisma.order.findFirst({
      orderBy: { id: 'desc' }
    });
    const newId = (lastOrder?.id || 0) + 1;

    const created = await prisma.order.create({
      data: {
        id: newId,
        ...order,
        status: order.status || 'processing',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    return this.mapOrderFromPrisma(created);
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const updated = await prisma.order.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date()
      }
    });
    return this.mapOrderFromPrisma(updated);
  }

  // Saved Builds Management
  async getUserSavedBuilds(userId: string): Promise<SavedBuild[]> {
    const savedBuilds = await prisma.savedBuild.findMany({
      where: { userId },
      orderBy: { savedAt: 'desc' }
    });
    return savedBuilds.map(this.mapSavedBuildFromPrisma);
  }

  async saveUserBuild(savedBuild: InsertSavedBuild): Promise<SavedBuild> {
    const { userId, buildId } = savedBuild;
    // Check if already saved
    const existing = await prisma.savedBuild.findUnique({
      where: {
        userId_buildId: { userId, buildId }
      }
    });
    
    if (existing) {
      return this.mapSavedBuildFromPrisma(existing);
    }

    const lastSavedBuild = await prisma.savedBuild.findFirst({
      orderBy: { id: 'desc' }
    });
    const newId = (lastSavedBuild?.id || 0) + 1;

    const saved = await prisma.savedBuild.create({
      data: {
        id: newId,
        userId,
        buildId,
        savedAt: new Date()
      }
    });
    return this.mapSavedBuildFromPrisma(saved);
  }

  async removeSavedBuild(userId: string, buildId: number): Promise<void> {
    await prisma.savedBuild.deleteMany({
      where: { userId, buildId }
    });
  }

  // Address Management (placeholder implementations)
  async getUserAddresses(userId: string): Promise<UserAddress[]> {
    const addresses = await prisma.userAddress.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return addresses.map(this.mapUserAddressFromPrisma);
  }

  async saveUserAddress(address: InsertUserAddress): Promise<UserAddress> {
    const created = await prisma.userAddress.create({
      data: {
        ...address,
        createdAt: new Date()
      }
    });
    return this.mapUserAddressFromPrisma(created);
  }

  async updateUserAddress(addressId: string, address: Partial<InsertUserAddress>): Promise<UserAddress> {
    const updated = await prisma.userAddress.update({
      where: { id: addressId },
      data: address
    });
    return this.mapUserAddressFromPrisma(updated);
  }

  async deleteUserAddress(addressId: string): Promise<void> {
    await prisma.userAddress.delete({
      where: { id: addressId }
    });
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    await prisma.$transaction([
      // Remove default from all addresses
      prisma.userAddress.updateMany({
        where: { userId },
        data: { isDefault: false }
      }),
      // Set new default
      prisma.userAddress.update({
        where: { id: addressId },
        data: { isDefault: true }
      })
    ]);
  }

  // Account Linking Methods (simplified implementations)
  async getUserProfilesByEmail(email: string): Promise<UserProfile[]> {
    const profiles = await prisma.userProfile.findMany({
      where: { email }
    });
    return profiles.map(this.mapUserProfileFromPrisma);
  }

  async getOrdersByEmail(email: string): Promise<Order[]> {
    const orders = await prisma.order.findMany({
      where: { customerEmail: email }
    });
    return orders.map(this.mapOrderFromPrisma);
  }

  async getSavedBuildsByEmail(email: string): Promise<SavedBuild[]> {
    // Would need to join with user profiles to find by email
    const profiles = await this.getUserProfilesByEmail(email);
    if (profiles.length === 0) return [];
    
    const savedBuilds = await prisma.savedBuild.findMany({
      where: {
        userId: { in: profiles.map(p => p.uid) }
      }
    });
    return savedBuilds.map(this.mapSavedBuildFromPrisma);
  }

  async mergeUserAccounts(currentUserId: string, email: string, mergeData: {
    profiles: UserProfile[];
    orders: Order[];
    savedBuilds: SavedBuild[];
  }): Promise<void> {
    // Implementation would involve complex data merging
    // For now, this is a placeholder
    console.log(`Merging accounts for ${currentUserId} with email ${email}`);
  }

  // Subscription Management (placeholder implementations)
  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return subscriptions.map(this.mapSubscriptionFromPrisma);
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return subscriptions.map(this.mapSubscriptionFromPrisma);
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const created = await prisma.subscription.create({
      data: {
        id: crypto.randomUUID(),
        ...subscription,
        status: subscription.status || 'pending',
        totalDelivered: 0,
        successfulPayments: 0,
        failedPayments: 0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    return this.mapSubscriptionFromPrisma(created);
  }

  async updateSubscription(id: string, subscription: Partial<InsertSubscription>): Promise<Subscription> {
    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        ...subscription,
        updatedAt: new Date()
      }
    });
    return this.mapSubscriptionFromPrisma(updated);
  }

  async updateSubscriptionStatus(id: string, status: 'active' | 'paused' | 'cancelled' | 'expired' | 'pending'): Promise<Subscription> {
    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date()
      }
    });
    return this.mapSubscriptionFromPrisma(updated);
  }

  async getSubscriptionById(id: string): Promise<Subscription | undefined> {
    const subscription = await prisma.subscription.findUnique({
      where: { id }
    });
    return subscription ? this.mapSubscriptionFromPrisma(subscription) : undefined;
  }

  async cancelSubscription(id: string, reason?: string): Promise<Subscription> {
    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason,
        updatedAt: new Date()
      }
    });
    return this.mapSubscriptionFromPrisma(updated);
  }

  async pauseSubscription(id: string): Promise<Subscription> {
    return this.updateSubscriptionStatus(id, 'paused');
  }

  async resumeSubscription(id: string): Promise<Subscription> {
    return this.updateSubscriptionStatus(id, 'active');
  }

  async getActiveSubscriptions(): Promise<Subscription[]> {
    const subscriptions = await prisma.subscription.findMany({
      where: { status: 'active' }
    });
    return subscriptions.map(this.mapSubscriptionFromPrisma);
  }

  async getSubscriptionsDueBilling(date?: Date): Promise<Subscription[]> {
    const targetDate = date || new Date();
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        nextBillingDate: { lte: targetDate }
      }
    });
    return subscriptions.map(this.mapSubscriptionFromPrisma);
  }

  // Subscription Orders Management
  async getSubscriptionOrders(subscriptionId: string): Promise<SubscriptionOrder[]> {
    const orders = await prisma.subscriptionOrder.findMany({
      where: { subscriptionId },
      orderBy: { createdAt: 'desc' }
    });
    return orders.map(this.mapSubscriptionOrderFromPrisma);
  }

  async getUserSubscriptionOrders(userId: string): Promise<SubscriptionOrder[]> {
    const orders = await prisma.subscriptionOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return orders.map(this.mapSubscriptionOrderFromPrisma);
  }

  async createSubscriptionOrder(order: InsertSubscriptionOrder): Promise<SubscriptionOrder> {
    const created = await prisma.subscriptionOrder.create({
      data: {
        id: crypto.randomUUID(),
        ...order,
        status: order.status || 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    return this.mapSubscriptionOrderFromPrisma(created);
  }

  async updateSubscriptionOrderStatus(id: string, status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'failed'): Promise<SubscriptionOrder> {
    const updated = await prisma.subscriptionOrder.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date()
      }
    });
    return this.mapSubscriptionOrderFromPrisma(updated);
  }

  async getSubscriptionOrderById(id: string): Promise<SubscriptionOrder | undefined> {
    const order = await prisma.subscriptionOrder.findUnique({
      where: { id }
    });
    return order ? this.mapSubscriptionOrderFromPrisma(order) : undefined;
  }

  // Mapper functions to convert Prisma types to shared types
  private mapPcBuildFromPrisma(build: any): PcBuild {
    return {
      ...build,
      basePrice: Number(build.basePrice),
      profitMargin: Number(build.profitMargin),
      totalPrice: Number(build.totalPrice),
      createdAt: new Date(build.createdAt),
      updatedAt: new Date(build.updatedAt)
    };
  }

  private mapComponentFromPrisma(component: any): Component {
    return {
      ...component,
      createdAt: new Date(component.createdAt),
      updatedAt: new Date(component.updatedAt)
    };
  }

  private mapInquiryFromPrisma(inquiry: any): Inquiry {
    return {
      ...inquiry,
      createdAt: new Date(inquiry.createdAt),
      updatedAt: new Date(inquiry.updatedAt)
    };
  }

  private mapUserProfileFromPrisma(profile: any): UserProfile {
    return {
      ...profile,
      createdAt: new Date(profile.createdAt),
      updatedAt: new Date(profile.updatedAt)
    };
  }

  private mapOrderFromPrisma(order: any): Order {
    return {
      ...order,
      total: Number(order.total),
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt)
    };
  }

  private mapSavedBuildFromPrisma(savedBuild: any): SavedBuild {
    return {
      ...savedBuild,
      savedAt: new Date(savedBuild.savedAt)
    };
  }

  private mapUserAddressFromPrisma(address: any): UserAddress {
    return {
      ...address,
      createdAt: new Date(address.createdAt)
    };
  }

  private mapSubscriptionFromPrisma(subscription: any): Subscription {
    return {
      ...subscription,
      items: Array.isArray(subscription.items) ? subscription.items : JSON.parse(subscription.items),
      basePrice: Number(subscription.basePrice),
      finalPrice: Number(subscription.finalPrice),
      currentPeriodStart: new Date(subscription.currentPeriodStart),
      currentPeriodEnd: new Date(subscription.currentPeriodEnd),
      nextBillingDate: new Date(subscription.nextBillingDate),
      lastPaymentDate: subscription.lastPaymentDate ? new Date(subscription.lastPaymentDate) : undefined,
      createdAt: new Date(subscription.createdAt),
      updatedAt: new Date(subscription.updatedAt),
      cancelledAt: subscription.cancelledAt ? new Date(subscription.cancelledAt) : undefined
    };
  }

  private mapSubscriptionOrderFromPrisma(order: any): SubscriptionOrder {
    return {
      ...order,
      amount: Number(order.amount),
      deliveryDate: order.deliveryDate ? new Date(order.deliveryDate) : undefined,
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt)
    };
  }
}

export const prismaStorage = new PrismaStorage();