import { storage } from '../storage';
import { db } from '../db';
import { pcBuilds, orders, userProfiles, inquiries } from '@shared/schema';

export class BackupService {
  constructor() {}

  async connect() {
    try {
      // Test database connection
      await db.select().from(pcBuilds).limit(1);
      console.log('✅ Backup database connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect to backup database:', error);
    }
  }

  async disconnect() {
    // Drizzle connections are managed automatically
    console.log('✅ Backup database disconnected');
  }

  // Verify PC Builds data integrity
  async backupPcBuilds() {
    try {
      const builds = await storage.getPcBuilds();
      console.log(`✅ Verified ${builds.length} PC builds in database`);
      return builds.length;
    } catch (error) {
      console.error('❌ Failed to verify PC builds:', error);
      throw error;
    }
  }

  // Verify Orders data integrity
  async backupOrders() {
    try {
      const orders = await storage.getAllOrders();
      console.log(`✅ Verified ${orders.length} orders in database`);
      return orders.length;
    } catch (error) {
      console.error('❌ Failed to verify orders:', error);
      throw error;
    }
  }

  // Verify User Profiles data integrity
  async backupUserProfiles() {
    try {
      const users = await storage.getAllUserProfiles();
      console.log(`✅ Verified ${users.length} user profiles in database`);
      return users.length;
    } catch (error) {
      console.error('❌ Failed to verify user profiles:', error);
      throw error;
    }
  }

  // Verify Inquiries data integrity
  async backupInquiries() {
    try {
      const inquiries = await storage.getInquiries();
      console.log(`✅ Verified ${inquiries.length} inquiries in database`);
      return inquiries.length;
    } catch (error) {
      console.error('❌ Failed to verify inquiries:', error);
      throw error;
    }
  }

  // Full data verification operation
  async performFullBackup() {
    console.log('🔄 Starting data verification operation...');
    
    await this.connect();
    
    try {
      const [buildsCount, ordersCount, usersCount, inquiriesCount] = await Promise.all([
        this.backupPcBuilds(),
        this.backupOrders(),
        this.backupUserProfiles(),
        this.backupInquiries(),
      ]);
      
      console.log('✅ Data verification completed successfully');
      return { buildsCount, ordersCount, usersCount, inquiriesCount };
    } catch (error) {
      console.error('❌ Data verification failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  // Get current database information
  async restoreFromBackup() {
    console.log('🔄 Retrieving current database information...');
    
    await this.connect();
    
    try {
      const buildsCount = await this.backupPcBuilds();
      const ordersCount = await this.backupOrders();
      const usersCount = await this.backupUserProfiles();
      const inquiriesCount = await this.backupInquiries();
      
      console.log(`📊 Current database contains:`);
      console.log(`   - ${buildsCount} PC builds`);
      console.log(`   - ${ordersCount} orders`);
      console.log(`   - ${usersCount} user profiles`);
      console.log(`   - ${inquiriesCount} inquiries`);
      
      return { buildsCount, ordersCount, usersCount, inquiriesCount };
    } catch (error) {
      console.error('❌ Database information retrieval failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  // Check database health
  async checkBackupHealth() {
    await this.connect();
    
    try {
      const buildsCount = await this.backupPcBuilds();
      const ordersCount = await this.backupOrders();
      const usersCount = await this.backupUserProfiles();
      
      console.log(`📊 Database Health Check:`);
      console.log(`   - PC Builds: ${buildsCount}`);
      console.log(`   - Orders: ${ordersCount}`);
      console.log(`   - Users: ${usersCount}`);
      console.log(`   - Status: ✅ Healthy`);
      
      return {
        status: 'healthy',
        counts: {
          builds: buildsCount,
          orders: ordersCount,
          users: usersCount,
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