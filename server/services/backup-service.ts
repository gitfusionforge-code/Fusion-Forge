import { storage } from '../storage'; // Firebase (primary)
import { db } from '../db'; // NeonDB (backup)
import { pcBuilds, orders, userProfiles, inquiries } from '@shared/schema';
import { eq } from 'drizzle-orm';
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
      
      // Sync each build to NeonDB with better error handling
      let successCount = 0;
      if (firebaseBuilds.length > 0) {
        for (const build of firebaseBuilds) {
          try {
            // Check if build already exists in NeonDB
            const existingBuild = await this.neonStorage.getPcBuildById(build.id);
            
            if (existingBuild) {
              // Update existing build
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
              console.log(`🔄 Updated existing PC build ${build.id}`);
            } else {
              // Create new build
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
              console.log(`✨ Created new PC build ${build.id}`);
            }
            successCount++;
          } catch (syncError) {
            console.error(`❌ Failed to sync PC build ${build.id}:`, {
              error: syncError instanceof Error ? syncError.message : 'Unknown error',
              buildData: {
                id: build.id,
                name: build.name,
                category: build.category
              }
            });
          }
        }
      }
      
      console.log(`✅ Successfully synced ${successCount}/${firebaseBuilds.length} PC builds to NeonDB`);
      return successCount;
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
      
      // Get all existing orders from NeonDB once (much more efficient)
      const existingOrders = await this.neonStorage.getAllOrders();
      console.log(`📊 Found ${existingOrders.length} existing orders in NeonDB`);
      
      // Create a map for faster lookups using order number
      const existingOrdersMap = new Map();
      existingOrders.forEach(order => {
        existingOrdersMap.set(order.orderNumber, order);
      });
      
      // Sync each order to NeonDB with better error handling
      let successCount = 0;
      let updatedCount = 0;
      let createdCount = 0;
      
      if (firebaseOrders.length > 0) {
        for (const order of firebaseOrders) {
          try {
            // Check if order already exists by order number
            const existingOrder = existingOrdersMap.get(order.orderNumber);
            
            if (existingOrder) {
              // Update existing order only if status changed
              if (existingOrder.status !== order.status) {
                await this.neonStorage.updateOrderStatus(existingOrder.id, order.status);
                console.log(`🔄 Updated order status ${existingOrder.id}: ${existingOrder.status} → ${order.status}`);
                updatedCount++;
              } else {
                console.log(`✅ Order ${order.orderNumber} already up to date`);
              }
            } else {
              // Before creating new order, check if user exists in NeonDB
              const userExists = await this.neonStorage.getUserProfile(order.userId);
              if (!userExists) {
                // Create a basic user profile for the missing user
                try {
                  // Double-check the user doesn't exist (might have been created in this sync)
                  const recheckUser = await this.neonStorage.getUserProfile(order.userId);
                  if (!recheckUser) {
                    await this.neonStorage.createUserProfile({
                      uid: order.userId,
                      email: order.customerEmail || `${order.userId}@unknown.com`,
                      displayName: order.customerName || 'Unknown User',
                      phone: null,
                      address: order.shippingAddress || null,
                      city: null,
                      zipCode: null,
                      preferences: null
                    });
                    console.log(`✨ Created missing user profile for ${order.userId}`);
                  } else {
                    console.log(`🔄 User ${order.userId} already exists (created in this sync)`);
                  }
                } catch (userCreateError) {
                  console.warn(`⚠️ Failed to create user ${order.userId}, skipping order ${order.orderNumber}:`, userCreateError);
                  continue;
                }
              }
              
              // Create new order
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
              console.log(`✨ Created new order: ${order.orderNumber}`);
              createdCount++;
              
              // Add to our map to avoid processing it again if there are duplicates in Firebase
              existingOrdersMap.set(order.orderNumber, { id: 'temp', orderNumber: order.orderNumber, status: order.status });
            }
            successCount++;
          } catch (syncError) {
            console.error(`❌ Failed to sync order ${order.orderNumber}:`, {
              error: syncError instanceof Error ? syncError.message : 'Unknown error',
              orderData: {
                id: order.id,
                orderNumber: order.orderNumber,
                userId: order.userId,
                total: order.total
              }
            });
          }
        }
      }
      
      console.log(`✅ Successfully synced ${successCount}/${firebaseOrders.length} orders to NeonDB`);
      console.log(`📈 Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${successCount - createdCount - updatedCount}`);
      return successCount;
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
      
      // Sync each user profile to NeonDB with better error handling
      let successCount = 0;
      if (firebaseUsers.length > 0) {
        for (const user of firebaseUsers) {
          try {
            // Check if user profile already exists in NeonDB
            const existingUser = await this.neonStorage.getUserProfile(user.uid);
            
            if (existingUser) {
              // Update existing user profile
              await this.neonStorage.updateUserProfile(user.uid, {
                email: user.email,
                displayName: user.displayName,
                phone: user.phone,
                address: user.address,
                city: user.city,
                zipCode: user.zipCode,
                preferences: user.preferences
              });
              console.log(`🔄 Updated existing user profile ${user.uid}`);
            } else {
              // Create new user profile
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
              console.log(`✨ Created new user profile ${user.uid}`);
            }
            successCount++;
          } catch (syncError) {
            console.error(`❌ Failed to sync user profile ${user.uid}:`, {
              error: syncError instanceof Error ? syncError.message : 'Unknown error',
              userData: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName
              }
            });
          }
        }
      }
      
      console.log(`✅ Successfully synced ${successCount}/${firebaseUsers.length} user profiles to NeonDB`);
      return successCount;
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
      
      // Get all existing inquiries from NeonDB once (much more efficient)
      const existingInquiries = await this.neonStorage.getInquiries();
      console.log(`📊 Found ${existingInquiries.length} existing inquiries in NeonDB`);
      
      // Create a map for faster lookups using normalized composite key
      const existingInquiriesMap = new Map();
      existingInquiries.forEach(inquiry => {
        // Use normalized values for comparison (trim whitespace, lowercase email)
        const key = `${inquiry.name.trim().toLowerCase()}|${inquiry.email.trim().toLowerCase()}|${inquiry.budget.trim()}|${inquiry.useCase.trim()}`;
        existingInquiriesMap.set(key, inquiry);
      });
      
      // Sync each inquiry to NeonDB with better error handling
      let successCount = 0;
      let updatedCount = 0;
      let createdCount = 0;
      
      if (firebaseInquiries.length > 0) {
        for (const inquiry of firebaseInquiries) {
          try {
            // Create normalized composite key for this Firebase inquiry
            const normalizedKey = `${inquiry.name.trim().toLowerCase()}|${inquiry.email.trim().toLowerCase()}|${inquiry.budget.trim()}|${inquiry.useCase.trim()}`;
            const existingInquiry = existingInquiriesMap.get(normalizedKey);
            
            if (existingInquiry) {
              // Update existing inquiry only if status changed
              if (existingInquiry.status !== inquiry.status) {
                await this.neonStorage.updateInquiryStatus(existingInquiry.id, inquiry.status);
                console.log(`🔄 Updated inquiry status ${existingInquiry.id}: ${existingInquiry.status} → ${inquiry.status}`);
                updatedCount++;
              } else {
                console.log(`✅ Inquiry ${existingInquiry.id} already up to date`);
              }
            } else {
              // Create new inquiry
              await this.neonStorage.createInquiry({
                name: inquiry.name,
                email: inquiry.email,
                budget: inquiry.budget,
                useCase: inquiry.useCase,
                details: inquiry.details,
                status: inquiry.status
              });
              console.log(`✨ Created new inquiry: ${inquiry.name} (${inquiry.email})`);
              createdCount++;
            }
            successCount++;
          } catch (syncError) {
            console.error(`❌ Failed to sync inquiry ${inquiry.id}:`, {
              error: syncError instanceof Error ? syncError.message : 'Unknown error',
              inquiryData: {
                id: inquiry.id,
                name: inquiry.name,
                email: inquiry.email,
                status: inquiry.status
              }
            });
          }
        }
      }
      
      console.log(`✅ Successfully synced ${successCount}/${firebaseInquiries.length} inquiries to NeonDB`);
      console.log(`📈 Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${successCount - createdCount - updatedCount}`);
      return successCount;
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
      // Sync users first to ensure foreign key constraints are satisfied
      const usersCount = await this.backupUserProfiles();
      
      // Then sync the rest in parallel
      const [buildsCount, ordersCount, inquiriesCount] = await Promise.all([
        this.backupPcBuilds(),
        this.backupOrders(),
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

  // Clean up orphaned records in NeonDB that don't exist in Firebase
  async cleanupOrphanedRecords(performCleanup: boolean = false) {
    console.log('🧹 Starting orphaned records cleanup analysis...');
    
    await this.connect();
    
    try {
      // Get data from both databases
      const firebaseBuilds = await firebaseRealtimeStorage.getPcBuilds();
      const firebaseOrders = await firebaseRealtimeStorage.getAllOrders();
      const firebaseUsers = await firebaseRealtimeStorage.getAllUserProfiles();
      const firebaseInquiries = await firebaseRealtimeStorage.getInquiries();
      
      const neonBuilds = await this.neonStorage.getPcBuilds();
      const neonOrders = await this.neonStorage.getAllOrders();
      const neonUsers = await this.neonStorage.getAllUserProfiles();
      const neonInquiries = await this.neonStorage.getInquiries();

      let cleanupSummary = {
        inquiriesToRemove: 0,
        ordersToRemove: 0,
        usersToRemove: 0,
        buildsToRemove: 0
      };

      // 1. Clean up orphaned inquiries
      const firebaseInquiryKeys = new Set();
      firebaseInquiries.forEach(inquiry => {
        const key = `${inquiry.name.trim().toLowerCase()}|${inquiry.email.trim().toLowerCase()}|${inquiry.budget.trim()}|${inquiry.useCase.trim()}`;
        firebaseInquiryKeys.add(key);
      });

      const orphanedInquiries = neonInquiries.filter(inquiry => {
        const key = `${inquiry.name.trim().toLowerCase()}|${inquiry.email.trim().toLowerCase()}|${inquiry.budget.trim()}|${inquiry.useCase.trim()}`;
        return !firebaseInquiryKeys.has(key);
      });

      console.log(`🔍 Found ${orphanedInquiries.length} orphaned inquiries in NeonDB`);
      if (orphanedInquiries.length > 0) {
        orphanedInquiries.forEach(inquiry => {
          console.log(`  - Inquiry ID ${inquiry.id}: ${inquiry.name} (${inquiry.email})`);
        });
        
        if (performCleanup) {
          for (const inquiry of orphanedInquiries) {
            await db.delete(inquiries).where(eq(inquiries.id, inquiry.id));
            console.log(`🗑️ Removed orphaned inquiry ID ${inquiry.id}`);
          }
          cleanupSummary.inquiriesToRemove = orphanedInquiries.length;
        }
      }

      // 2. Clean up orphaned orders
      const firebaseOrderNumbers = new Set(firebaseOrders.map(order => order.orderNumber));
      const orphanedOrders = neonOrders.filter(order => {
        // Remove orders that don't exist in Firebase or have suffixed order numbers (created by old backup logic)
        return !firebaseOrderNumbers.has(order.orderNumber) || order.orderNumber.includes('-');
      });

      console.log(`🔍 Found ${orphanedOrders.length} orphaned orders in NeonDB`);
      if (orphanedOrders.length > 0) {
        orphanedOrders.forEach(order => {
          console.log(`  - Order ID ${order.id}: ${order.orderNumber} (${order.customerName})`);
        });
        
        if (performCleanup) {
          for (const order of orphanedOrders) {
            await db.delete(orders).where(eq(orders.id, order.id));
            console.log(`🗑️ Removed orphaned order ID ${order.id}`);
          }
          cleanupSummary.ordersToRemove = orphanedOrders.length;
        }
      }

      // 3. Clean up orphaned users (users that don't exist in Firebase)
      const firebaseUserIds = new Set(firebaseUsers.map(user => user.uid));
      const orphanedUsers = neonUsers.filter(user => !firebaseUserIds.has(user.uid));

      console.log(`🔍 Found ${orphanedUsers.length} orphaned users in NeonDB`);
      if (orphanedUsers.length > 0) {
        orphanedUsers.forEach(user => {
          console.log(`  - User ID ${user.uid}: ${user.displayName} (${user.email})`);
        });
        
        if (performCleanup) {
          for (const user of orphanedUsers) {
            await db.delete(userProfiles).where(eq(userProfiles.uid, user.uid));
            console.log(`🗑️ Removed orphaned user ${user.uid}`);
          }
          cleanupSummary.usersToRemove = orphanedUsers.length;
        }
      }

      if (performCleanup) {
        console.log('✅ Cleanup completed successfully');
        console.log(`📊 Removed: ${cleanupSummary.inquiriesToRemove} inquiries, ${cleanupSummary.ordersToRemove} orders, ${cleanupSummary.usersToRemove} users`);
      } else {
        console.log('ℹ️ This was a dry run. Use performCleanup=true to actually remove orphaned records.');
        console.log(`📊 Would remove: ${orphanedInquiries.length} inquiries, ${orphanedOrders.length} orders, ${orphanedUsers.length} users`);
      }

      return {
        success: true,
        performed: performCleanup,
        summary: cleanupSummary,
        orphanedCounts: {
          inquiries: orphanedInquiries.length,
          orders: orphanedOrders.length,
          users: orphanedUsers.length
        }
      };
    } catch (error) {
      console.error('❌ Cleanup operation failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

export const backupService = new BackupService();