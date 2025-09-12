/**
 * Prisma Integration Test - Demonstrates Prisma working alongside Firebase
 */

import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export async function testPrismaIntegration() {
  console.log('🧪 Testing Prisma integration...');
  
  try {
    // Test 1: Create a sample PC Build in Prisma
    const testBuild = await prisma.pcBuild.create({
      data: {
        id: 999, // Test ID to avoid conflicts
        name: 'Prisma Test Build',
        category: 'Testing',
        buildType: 'CPU Only',
        budgetRange: '₹50,000',
        basePrice: 45000,
        profitMargin: 5000,
        totalPrice: 50000,
        processor: 'Test CPU',
        motherboard: 'Test MB',
        ram: 'Test RAM',
        storage: 'Test SSD',
        casePsu: 'Test Case',
        stockQuantity: 5,
        lowStockThreshold: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Prisma PC Build created:', testBuild.name);
    
    // Test 2: Read back the data
    const retrieved = await prisma.pcBuild.findUnique({
      where: { id: 999 }
    });
    
    console.log('✅ Prisma PC Build retrieved:', retrieved?.name);
    
    // Test 3: Create a sample user profile
    const testProfile = await prisma.userProfile.create({
      data: {
        id: 999,
        uid: 'prisma-test-user',
        email: 'prisma-test@example.com',
        displayName: 'Prisma Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Prisma UserProfile created:', testProfile.displayName);
    
    // Test 4: Count records
    const buildCount = await prisma.pcBuild.count();
    const profileCount = await prisma.userProfile.count();
    
    console.log('📊 Prisma Database Stats:', {
      builds: buildCount,
      profiles: profileCount
    });
    
    // Cleanup test data
    await prisma.pcBuild.delete({ where: { id: 999 } });
    await prisma.userProfile.delete({ where: { id: 999 } });
    
    console.log('🧹 Test data cleaned up');
    
    return {
      success: true,
      message: 'Prisma integration working perfectly!',
      stats: { builds: buildCount - 1, profiles: profileCount - 1 }
    };
    
  } catch (error) {
    console.error('❌ Prisma test failed:', error);
    return {
      success: false,
      message: 'Prisma integration test failed',
      error: error.message
    };
  } finally {
    await prisma.$disconnect();
  }
}