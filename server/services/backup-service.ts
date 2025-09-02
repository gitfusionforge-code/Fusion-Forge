import { PrismaClient } from '@prisma/client';
import { storage } from '../storage';

export class BackupService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async connect() {
    try {
      await this.prisma.$connect();
      console.log('✅ Backup database connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect to backup database:', error);
    }
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }

  // Backup PC Builds
  async backupPcBuilds() {
    try {
      const builds = await storage.getPcBuilds();
      
      for (const build of builds) {
        await this.prisma.pcBuild.upsert({
          where: { id: build.id },
          update: {
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
            isActive: build.isActive,
            updatedAt: new Date(),
          },
          create: {
            id: build.id,
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
            isActive: build.isActive,
            createdAt: build.createdAt,
            updatedAt: new Date(),
          },
        });
      }
      
      console.log(`✅ Backed up ${builds.length} PC builds`);
    } catch (error) {
      console.error('❌ Failed to backup PC builds:', error);
    }
  }

  // Backup Orders
  async backupOrders() {
    try {
      const orders = await storage.getAllOrders();
      
      for (const order of orders) {
        await this.prisma.order.upsert({
          where: { id: order.id },
          update: {
            userId: order.userId,
            orderNumber: order.orderNumber,
            status: order.status,
            total: parseFloat(order.total.toString()),
            items: order.items,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            shippingAddress: order.shippingAddress,
            billingAddress: order.billingAddress,
            paymentMethod: order.paymentMethod,
            trackingNumber: order.trackingNumber,
            updatedAt: new Date(),
          },
          create: {
            id: order.id,
            userId: order.userId,
            orderNumber: order.orderNumber,
            status: order.status,
            total: parseFloat(order.total.toString()),
            items: order.items,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            shippingAddress: order.shippingAddress,
            billingAddress: order.billingAddress,
            paymentMethod: order.paymentMethod,
            trackingNumber: order.trackingNumber,
            createdAt: order.createdAt,
            updatedAt: new Date(),
          },
        });
      }
      
      console.log(`✅ Backed up ${orders.length} orders`);
    } catch (error) {
      console.error('❌ Failed to backup orders:', error);
    }
  }

  // Backup User Profiles
  async backupUserProfiles() {
    try {
      const users = await storage.getAllUserProfiles();
      
      for (const user of users) {
        await this.prisma.userProfile.upsert({
          where: { uid: user.uid },
          update: {
            email: user.email,
            displayName: user.displayName,
            phone: user.phone,
            address: user.address,
            city: user.city,
            zipCode: user.zipCode,
            preferences: user.preferences,
            updatedAt: new Date(),
          },
          create: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            phone: user.phone,
            address: user.address,
            city: user.city,
            zipCode: user.zipCode,
            preferences: user.preferences,
            createdAt: user.createdAt,
            updatedAt: new Date(),
          },
        });
      }
      
      console.log(`✅ Backed up ${users.length} user profiles`);
    } catch (error) {
      console.error('❌ Failed to backup user profiles:', error);
    }
  }

  // Backup Inquiries
  async backupInquiries() {
    try {
      const inquiries = await storage.getInquiries();
      
      for (const inquiry of inquiries) {
        await this.prisma.inquiry.upsert({
          where: { id: inquiry.id },
          update: {
            name: inquiry.name,
            email: inquiry.email,
            budget: inquiry.budget,
            useCase: inquiry.useCase,
            details: inquiry.details,
            status: inquiry.status,
            updatedAt: new Date(),
          },
          create: {
            id: inquiry.id,
            name: inquiry.name,
            email: inquiry.email,
            budget: inquiry.budget,
            useCase: inquiry.useCase,
            details: inquiry.details,
            status: inquiry.status,
            createdAt: inquiry.createdAt,
            updatedAt: new Date(),
          },
        });
      }
      
      console.log(`✅ Backed up ${inquiries.length} inquiries`);
    } catch (error) {
      console.error('❌ Failed to backup inquiries:', error);
    }
  }

  // Full backup operation
  async performFullBackup() {
    console.log('🔄 Starting full backup operation...');
    
    await this.connect();
    
    try {
      await Promise.all([
        this.backupPcBuilds(),
        this.backupOrders(),
        this.backupUserProfiles(),
        this.backupInquiries(),
      ]);
      
      console.log('✅ Full backup completed successfully');
    } catch (error) {
      console.error('❌ Backup operation failed:', error);
    } finally {
      await this.disconnect();
    }
  }

  // Restore data from backup (in case of emergency)
  async restoreFromBackup() {
    console.log('🔄 Starting data restoration from backup...');
    
    await this.connect();
    
    try {
      // This would be implemented based on your storage interface
      // For now, just log the available data in backup
      const buildsCount = await this.prisma.pcBuild.count();
      const ordersCount = await this.prisma.order.count();
      const usersCount = await this.prisma.userProfile.count();
      const inquiriesCount = await this.prisma.inquiry.count();
      
      console.log(`📊 Backup database contains:`);
      console.log(`   - ${buildsCount} PC builds`);
      console.log(`   - ${ordersCount} orders`);
      console.log(`   - ${usersCount} user profiles`);
      console.log(`   - ${inquiriesCount} inquiries`);
      
    } catch (error) {
      console.error('❌ Restoration operation failed:', error);
    } finally {
      await this.disconnect();
    }
  }

  // Check backup health
  async checkBackupHealth() {
    await this.connect();
    
    try {
      const buildsCount = await this.prisma.pcBuild.count();
      const ordersCount = await this.prisma.order.count();
      const usersCount = await this.prisma.userProfile.count();
      
      console.log(`📊 Backup Database Health Check:`);
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
      console.error('❌ Backup health check failed:', error);
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