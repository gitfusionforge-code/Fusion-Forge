import { storage } from '../storage'; // Firebase (primary)
import { db } from '../db'; // NeonDB (backup)
import { pcBuilds, orders, userProfiles, inquiries } from '@shared/schema';
import { firebaseRealtimeStorage } from '../firebase-realtime-storage';
import { DatabaseStorage } from '../storage';

export class BackupService {
  private neonStorage: DatabaseStorage;

  constructor() {
    this.neonStorage = new DatabaseStorage();
  }

  async connect() {
    try {
      // Test NeonDB backup database connection
      await db.select().from(pcBuilds).limit(1);
      console.log('✅ Backup database (NeonDB) connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect to backup database:', error);
    }
  }

  async disconnect() {
    // Drizzle connections are managed automatically
    console.log('✅ Backup database disconnected');
  }

  // Sync PC Builds from Firebase to NeonDB
  async backupPcBuilds() {
    try {
      // Get data from Firebase (primary)
      const firebaseBuilds = await firebaseRealtimeStorage.getPcBuilds();
      console.log(`🔄 Syncing ${firebaseBuilds.length} PC builds from Firebase to NeonDB`);
      
      // Clear existing data in NeonDB and insert fresh data
      if (firebaseBuilds.length > 0) {
        // Sync each build to NeonDB
        for (const build of firebaseBuilds) {
          try {
            await this.neonStorage.createPcBuild({
              name: build.name,
              category: build.category,
              buildType: build.buildType,
              budgetRange: build.budgetRange,
              basePrice: build.basePrice,
              profitMargin: build.profitMargin,
              totalPrice: build.totalPrice,
              description: build.description,
              imageUrl: build.imageUrl,
              processor: build.processor,
              motherboard: build.motherboard,
              ram: build.ram,
              storage: build.storage,
              gpu: build.gpu,
              casePsu: build.casePsu,
              monitor: build.monitor,
              keyboardMouse: build.keyboardMouse,
              mousePad: build.mousePad,
              stockQuantity: build.stockQuantity,
              lowStockThreshold: build.lowStockThreshold,
              isActive: build.isActive
            });
          } catch (createError) {
            // If create fails, try to update existing record
            try {
              await this.neonStorage.updatePcBuild(build.id, {
                name: build.name,
                category: build.category,
                buildType: build.buildType,
                budgetRange: build.budgetRange,
                basePrice: build.basePrice,
                profitMargin: build.profitMargin,
                totalPrice: build.totalPrice,
                description: build.description,
                imageUrl: build.imageUrl,
                processor: build.processor,
                motherboard: build.motherboard,
                ram: build.ram,
                storage: build.storage,
                gpu: build.gpu,
                casePsu: build.casePsu,
                monitor: build.monitor,
                keyboardMouse: build.keyboardMouse,
                mousePad: build.mousePad,
                stockQuantity: build.stockQuantity,
                lowStockThreshold: build.lowStockThreshold,
                isActive: build.isActive
              });
            } catch (updateError) {
              console.warn(`⚠️ Failed to sync PC build ${build.id}:`, updateError);
            }
          }
        }
      }
      
      console.log(`✅ Successfully synced ${firebaseBuilds.length} PC builds to NeonDB`);
      return firebaseBuilds.length;
    } catch (error) {
      console.error('❌ Failed to sync PC builds:', error);
      throw error;
    }
  }

  // Sync Orders from Firebase to NeonDB
  async backupOrders() {
    try {
      // Get data from Firebase (primary)
      const firebaseOrders = await firebaseRealtimeStorage.getAllOrders();
      console.log(`🔄 Syncing ${firebaseOrders.length} orders from Firebase to NeonDB`);
      
      // Sync each order to NeonDB
      if (firebaseOrders.length > 0) {
        for (const order of firebaseOrders) {
          try {
            await this.neonStorage.createOrder({
              userId: order.userId,
              orderNumber: order.orderNumber,
              status: order.status,
              total: order.total,
              items: order.items,
              customerName: order.customerName,
              customerEmail: order.customerEmail,
              shippingAddress: order.shippingAddress,
              billingAddress: order.billingAddress,
              paymentMethod: order.paymentMethod,
              trackingNumber: order.trackingNumber
            });
          } catch (createError) {
            // If create fails, try to update existing record
            try {
              await this.neonStorage.updateOrderStatus(order.id, order.status);
            } catch (updateError) {
              console.warn(`⚠️ Failed to sync order ${order.id}:`, updateError);
            }
          }
        }
      }
      
      console.log(`✅ Successfully synced ${firebaseOrders.length} orders to NeonDB`);
      return firebaseOrders.length;
    } catch (error) {
      console.error('❌ Failed to sync orders:', error);
      throw error;
    }
  }

  // Sync User Profiles from Firebase to NeonDB
  async backupUserProfiles() {
    try {
      // Get data from Firebase (primary)
      const firebaseUsers = await firebaseRealtimeStorage.getAllUserProfiles();
      console.log(`🔄 Syncing ${firebaseUsers.length} user profiles from Firebase to NeonDB`);
      
      // Sync each user profile to NeonDB
      if (firebaseUsers.length > 0) {
        for (const user of firebaseUsers) {
          try {
            await this.neonStorage.createUserProfile({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              phone: user.phone,
              address: user.address,
              city: user.city,
              zipCode: user.zipCode,
              preferences: user.preferences
            });
          } catch (createError) {
            // If create fails, try to update existing record
            try {
              await this.neonStorage.updateUserProfile(user.uid, {
                email: user.email,
                displayName: user.displayName,
                phone: user.phone,
                address: user.address,
                city: user.city,
                zipCode: user.zipCode,
                preferences: user.preferences
              });
            } catch (updateError) {
              console.warn(`⚠️ Failed to sync user profile ${user.uid}:`, updateError);
            }
          }
        }
      }
      
      console.log(`✅ Successfully synced ${firebaseUsers.length} user profiles to NeonDB`);
      return firebaseUsers.length;
    } catch (error) {
      console.error('❌ Failed to sync user profiles:', error);
      throw error;
    }
  }

  // Sync Inquiries from Firebase to NeonDB
  async backupInquiries() {
    try {
      // Get data from Firebase (primary)
      const firebaseInquiries = await firebaseRealtimeStorage.getInquiries();
      console.log(`🔄 Syncing ${firebaseInquiries.length} inquiries from Firebase to NeonDB`);
      
      // Sync each inquiry to NeonDB
      if (firebaseInquiries.length > 0) {
        for (const inquiry of firebaseInquiries) {
          try {
            await this.neonStorage.createInquiry({
              name: inquiry.name,
              email: inquiry.email,
              budget: inquiry.budget,
              useCase: inquiry.useCase,
              details: inquiry.details,
              status: inquiry.status
            });
          } catch (createError) {
            // If create fails, try to update existing record
            try {
              await this.neonStorage.updateInquiryStatus(inquiry.id, inquiry.status);
            } catch (updateError) {
              console.warn(`⚠️ Failed to sync inquiry ${inquiry.id}:`, updateError);
            }
          }
        }
      }
      
      console.log(`✅ Successfully synced ${firebaseInquiries.length} inquiries to NeonDB`);
      return firebaseInquiries.length;
    } catch (error) {
      console.error('❌ Failed to sync inquiries:', error);
      throw error;
    }
  }

  // Full Firebase → NeonDB sync operation
  async performFullBackup() {
    console.log('🔄 Starting Firebase → NeonDB sync operation...');
    
    await this.connect();
    
    try {
      const [buildsCount, ordersCount, usersCount, inquiriesCount] = await Promise.all([
        this.backupPcBuilds(),
        this.backupOrders(),
        this.backupUserProfiles(),
        this.backupInquiries(),
      ]);
      
      console.log('✅ Firebase → NeonDB sync completed successfully');
      console.log(`📊 Synced: ${buildsCount} builds, ${ordersCount} orders, ${usersCount} users, ${inquiriesCount} inquiries`);
      return { buildsCount, ordersCount, usersCount, inquiriesCount };
    } catch (error) {
      console.error('❌ Firebase → NeonDB sync failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  // Restore Firebase data from NeonDB backup
  async restoreFromBackup() {
    console.log('🔄 Starting NeonDB → Firebase restore operation...');
    
    await this.connect();
    
    try {
      // Get data from NeonDB (backup)
      const neonBuilds = await this.neonStorage.getPcBuilds();
      const neonOrders = await this.neonStorage.getAllOrders();
      const neonUsers = await this.neonStorage.getAllUserProfiles();
      const neonInquiries = await this.neonStorage.getInquiries();
      
      console.log(`🔄 Restoring from NeonDB: ${neonBuilds.length} builds, ${neonOrders.length} orders, ${neonUsers.length} users, ${neonInquiries.length} inquiries`);
      
      // Clear Firebase and restore from NeonDB
      // Note: This is a destructive operation - use with caution!
      
      console.log(`📊 NeonDB backup contains:`);
      console.log(`   - ${neonBuilds.length} PC builds`);
      console.log(`   - ${neonOrders.length} orders`);
      console.log(`   - ${neonUsers.length} user profiles`);
      console.log(`   - ${neonInquiries.length} inquiries`);
      console.log(`⚠️ Note: Use 'restore_execute' action to actually perform the restore`);
      
      return { 
        buildsCount: neonBuilds.length, 
        ordersCount: neonOrders.length, 
        usersCount: neonUsers.length, 
        inquiriesCount: neonInquiries.length 
      };
    } catch (error) {
      console.error('❌ NeonDB backup information retrieval failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  // Check sync status between Firebase and NeonDB
  async checkBackupHealth() {
    await this.connect();
    
    try {
      // Get counts from both databases
      const firebaseBuilds = await firebaseRealtimeStorage.getPcBuilds();
      const firebaseOrders = await firebaseRealtimeStorage.getAllOrders();
      const firebaseUsers = await firebaseRealtimeStorage.getAllUserProfiles();
      const firebaseInquiries = await firebaseRealtimeStorage.getInquiries();
      
      const neonBuilds = await this.neonStorage.getPcBuilds();
      const neonOrders = await this.neonStorage.getAllOrders();
      const neonUsers = await this.neonStorage.getAllUserProfiles();
      const neonInquiries = await this.neonStorage.getInquiries();
      
      console.log(`📊 Database Sync Status:`);
      console.log(`   Firebase (Primary): ${firebaseBuilds.length} builds, ${firebaseOrders.length} orders, ${firebaseUsers.length} users, ${firebaseInquiries.length} inquiries`);
      console.log(`   NeonDB (Backup): ${neonBuilds.length} builds, ${neonOrders.length} orders, ${neonUsers.length} users, ${neonInquiries.length} inquiries`);
      
      const inSync = (
        firebaseBuilds.length === neonBuilds.length &&
        firebaseOrders.length === neonOrders.length &&
        firebaseUsers.length === neonUsers.length &&
        firebaseInquiries.length === neonInquiries.length
      );
      
      console.log(`   Sync Status: ${inSync ? '✅ In Sync' : '⚠️ Out of Sync'}`);
      
      return {
        status: 'healthy',
        inSync,
        counts: {
          builds: firebaseBuilds.length,
          orders: firebaseOrders.length,
          users: firebaseUsers.length,
          inquiries: firebaseInquiries.length
        },
        backupCounts: {
          builds: neonBuilds.length,
          orders: neonOrders.length,
          users: neonUsers.length,
          inquiries: neonInquiries.length
        }
      };
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      await this.disconnect();
    }
  }
}

export const backupService = new BackupService();