// Advanced Discount and Coupon System
interface DiscountCode {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_x_get_y';
  value: number; // percentage (10 = 10%) or fixed amount
  minimumOrderValue?: number;
  maximumDiscount?: number;
  applicableCategories: string[];
  applicableProducts: number[];
  usageLimit?: number;
  usageCount: number;
  usagePerCustomer?: number;
  customerUsage: Map<string, number>;
  validFrom: number;
  validUntil: number;
  isActive: boolean;
  stackable: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

interface BulkPricingTier {
  id: string;
  name: string;
  minimumQuantity: number;
  discountPercentage: number;
  applicableCategories: string[];
  isActive: boolean;
}

interface DiscountApplication {
  discountId: string;
  discountCode: string;
  discountType: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  applicableItems: Array<{
    itemId: number;
    itemName: string;
    originalPrice: number;
    discountedPrice: number;
  }>;
}

class DiscountSystem {
  private discountCodes = new Map<string, DiscountCode>();
  private bulkPricingTiers: BulkPricingTier[] = [];

  constructor() {
    this.initializeDefaultDiscounts();
    this.initializeBulkPricing();
  }

  // Initialize default discount codes
  private initializeDefaultDiscounts() {
    const defaultDiscounts: Omit<DiscountCode, 'id' | 'customerUsage'>[] = [
      {
        code: 'WELCOME10',
        name: 'Welcome Discount',
        description: '10% off for new customers',
        type: 'percentage',
        value: 10,
        minimumOrderValue: 25000,
        maximumDiscount: 5000,
        applicableCategories: [],
        applicableProducts: [],
        usageLimit: 1000,
        usageCount: 0,
        usagePerCustomer: 1,
        validFrom: Date.now(),
        validUntil: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days
        isActive: true,
        stackable: false,
        createdBy: 'system',
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        code: 'GAMING20',
        name: 'Gaming PC Special',
        description: '20% off on gaming PCs above ₹50,000',
        type: 'percentage',
        value: 20,
        minimumOrderValue: 50000,
        maximumDiscount: 15000,
        applicableCategories: ['Gaming Beast', 'Performance Gamers', 'Elite Gaming Setups'],
        applicableProducts: [],
        usageLimit: 500,
        usageCount: 0,
        usagePerCustomer: 1,
        validFrom: Date.now(),
        validUntil: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        isActive: true,
        stackable: false,
        createdBy: 'admin',
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        code: 'STUDENT15',
        name: 'Student Discount',
        description: '15% off for students (requires verification)',
        type: 'percentage',
        value: 15,
        minimumOrderValue: 20000,
        maximumDiscount: 8000,
        applicableCategories: ['Budget Builders', 'Essential Creators'],
        applicableProducts: [],
        usageLimit: undefined, // Unlimited
        usageCount: 0,
        usagePerCustomer: 3, // 3 times per student
        validFrom: Date.now(),
        validUntil: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
        isActive: true,
        stackable: true,
        createdBy: 'admin',
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        code: 'FREESHIP',
        name: 'Free Shipping',
        description: 'Free shipping on orders above ₹25,000',
        type: 'free_shipping',
        value: 1500, // Standard shipping cost
        minimumOrderValue: 25000,
        applicableCategories: [],
        applicableProducts: [],
        usageLimit: undefined,
        usageCount: 0,
        usagePerCustomer: 5,
        validFrom: Date.now(),
        validUntil: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days
        isActive: true,
        stackable: true,
        createdBy: 'admin',
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        code: 'BULK5000',
        name: 'Bulk Order Discount',
        description: '₹5000 off on orders above ₹100,000',
        type: 'fixed_amount',
        value: 5000,
        minimumOrderValue: 100000,
        applicableCategories: [],
        applicableProducts: [],
        usageLimit: 100,
        usageCount: 0,
        usagePerCustomer: 2,
        validFrom: Date.now(),
        validUntil: Date.now() + 45 * 24 * 60 * 60 * 1000, // 45 days
        isActive: true,
        stackable: true,
        createdBy: 'admin',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    defaultDiscounts.forEach((discount, index) => {
      const id = `discount_${Date.now()}_${index}`;
      this.discountCodes.set(discount.code, {
        ...discount,
        id,
        customerUsage: new Map()
      });
    });
  }

  // Initialize bulk pricing tiers
  private initializeBulkPricing() {
    this.bulkPricingTiers = [
      {
        id: 'bulk_tier_1',
        name: 'Small Business (3-5 PCs)',
        minimumQuantity: 3,
        discountPercentage: 5,
        applicableCategories: ['Budget Builders', 'Essential Creators', 'Office Productivity'],
        isActive: true
      },
      {
        id: 'bulk_tier_2',
        name: 'Corporate (6-10 PCs)',
        minimumQuantity: 6,
        discountPercentage: 8,
        applicableCategories: ['Budget Builders', 'Essential Creators', 'Office Productivity', 'Performance Gamers'],
        isActive: true
      },
      {
        id: 'bulk_tier_3',
        name: 'Enterprise (11-25 PCs)',
        minimumQuantity: 11,
        discountPercentage: 12,
        applicableCategories: [], // All categories
        isActive: true
      },
      {
        id: 'bulk_tier_4',
        name: 'Large Enterprise (25+ PCs)',
        minimumQuantity: 25,
        discountPercentage: 18,
        applicableCategories: [], // All categories
        isActive: true
      }
    ];
  }

  // Validate and apply discount code
  async applyDiscountCode(
    code: string, 
    userId: string, 
    cartItems: Array<{ id: number; name: string; category: string; price: number; quantity: number }>
  ): Promise<DiscountApplication | { error: string }> {
    const discount = this.discountCodes.get(code.toUpperCase());
    
    if (!discount) {
      return { error: 'Invalid discount code' };
    }

    // Check if discount is active and valid
    const now = Date.now();
    if (!discount.isActive) {
      return { error: 'This discount code is no longer active' };
    }

    if (now < discount.validFrom || now > discount.validUntil) {
      return { error: 'This discount code has expired' };
    }

    // Check usage limits
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      return { error: 'This discount code has reached its usage limit' };
    }

    if (discount.usagePerCustomer) {
      const customerUsageCount = discount.customerUsage.get(userId) || 0;
      if (customerUsageCount >= discount.usagePerCustomer) {
        return { error: 'You have already used this discount code the maximum number of times' };
      }
    }

    // Calculate order totals
    const originalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Check minimum order value
    if (discount.minimumOrderValue && originalAmount < discount.minimumOrderValue) {
      return { error: `Minimum order value of ₹${discount.minimumOrderValue.toLocaleString()} required` };
    }

    // Filter applicable items
    const applicableItems = cartItems.filter(item => {
      // Check category restrictions
      if (discount.applicableCategories.length > 0 && !discount.applicableCategories.includes(item.category)) {
        return false;
      }

      // Check product restrictions
      if (discount.applicableProducts.length > 0 && !discount.applicableProducts.includes(item.id)) {
        return false;
      }

      return true;
    });

    if (applicableItems.length === 0) {
      return { error: 'This discount code is not applicable to items in your cart' };
    }

    // Calculate discount amount
    let discountAmount = 0;
    const processedItems = applicableItems.map(item => {
      const itemTotal = item.price * item.quantity;
      let itemDiscount = 0;

      switch (discount.type) {
        case 'percentage':
          itemDiscount = itemTotal * (discount.value / 100);
          break;
        case 'fixed_amount':
          // Distribute fixed amount proportionally across applicable items
          const applicableTotal = applicableItems.reduce((sum, ai) => sum + (ai.price * ai.quantity), 0);
          itemDiscount = (itemTotal / applicableTotal) * discount.value;
          break;
        case 'free_shipping':
          // Free shipping applied at order level
          itemDiscount = 0;
          break;
        case 'buy_x_get_y':
          // Simplified: every 2nd item gets discount
          if (item.quantity >= 2) {
            const freeItems = Math.floor(item.quantity / 2);
            itemDiscount = freeItems * item.price;
          }
          break;
      }

      discountAmount += itemDiscount;

      return {
        itemId: item.id,
        itemName: item.name,
        originalPrice: item.price,
        discountedPrice: item.price - (itemDiscount / item.quantity)
      };
    });

    // Apply maximum discount limit
    if (discount.maximumDiscount && discountAmount > discount.maximumDiscount) {
      discountAmount = discount.maximumDiscount;
    }

    // Special handling for free shipping
    if (discount.type === 'free_shipping') {
      discountAmount = discount.value; // Fixed shipping cost
    }

    const finalAmount = Math.max(0, originalAmount - discountAmount);

    return {
      discountId: discount.id,
      discountCode: discount.code,
      discountType: discount.type,
      originalAmount,
      discountAmount,
      finalAmount,
      applicableItems: processedItems
    };
  }

  // Apply bulk pricing discount
  calculateBulkDiscount(
    cartItems: Array<{ id: number; name: string; category: string; price: number; quantity: number }>
  ): { discountPercentage: number; discountAmount: number; tierName: string } | null {
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Find applicable bulk pricing tier
    const applicableTier = this.bulkPricingTiers
      .filter(tier => tier.isActive && totalQuantity >= tier.minimumQuantity)
      .sort((a, b) => b.minimumQuantity - a.minimumQuantity)[0]; // Get highest tier

    if (!applicableTier) return null;

    // Check if all items are in applicable categories
    const applicableItems = cartItems.filter(item => 
      applicableTier.applicableCategories.length === 0 || 
      applicableTier.applicableCategories.includes(item.category)
    );

    if (applicableItems.length === 0) return null;

    const originalAmount = applicableItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = originalAmount * (applicableTier.discountPercentage / 100);

    return {
      discountPercentage: applicableTier.discountPercentage,
      discountAmount,
      tierName: applicableTier.name
    };
  }

  // Confirm discount usage (call after successful payment)
  async confirmDiscountUsage(discountCode: string, userId: string): Promise<void> {
    const discount = this.discountCodes.get(discountCode.toUpperCase());
    if (discount) {
      // Increment usage counters
      discount.usageCount++;
      const currentUsage = discount.customerUsage.get(userId) || 0;
      discount.customerUsage.set(userId, currentUsage + 1);
      discount.updatedAt = Date.now();

      // Persist changes
      await this.persistDiscount(discount);
    }
  }

  // Create new discount code
  async createDiscountCode(discountData: Omit<DiscountCode, 'id' | 'customerUsage' | 'usageCount' | 'createdAt' | 'updatedAt'>): Promise<DiscountCode> {
    const id = `discount_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const discount: DiscountCode = {
      ...discountData,
      id,
      customerUsage: new Map(),
      usageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.discountCodes.set(discount.code.toUpperCase(), discount);
    await this.persistDiscount(discount);

    return discount;
  }

  // Get all discount codes for admin
  getAllDiscountCodes(): DiscountCode[] {
    return Array.from(this.discountCodes.values())
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // Get active discount codes
  getActiveDiscountCodes(): DiscountCode[] {
    const now = Date.now();
    return Array.from(this.discountCodes.values())
      .filter(discount => 
        discount.isActive && 
        discount.validFrom <= now && 
        discount.validUntil >= now &&
        (!discount.usageLimit || discount.usageCount < discount.usageLimit)
      );
  }

  // Generate promotional codes automatically
  async generatePromotionalCodes(params: {
    campaign: string;
    count: number;
    type: 'percentage' | 'fixed_amount';
    value: number;
    validDays: number;
    minimumOrderValue?: number;
    usagePerCustomer?: number;
  }): Promise<DiscountCode[]> {
    const codes: DiscountCode[] = [];

    for (let i = 0; i < params.count; i++) {
      const code = this.generateRandomCode(params.campaign);
      
      const discount = await this.createDiscountCode({
        code,
        name: `${params.campaign} - Auto Generated`,
        description: `Auto-generated promotional code for ${params.campaign}`,
        type: params.type,
        value: params.value,
        minimumOrderValue: params.minimumOrderValue,
        applicableCategories: [],
        applicableProducts: [],
        usageLimit: undefined,
        usagePerCustomer: params.usagePerCustomer || 1,
        validFrom: Date.now(),
        validUntil: Date.now() + params.validDays * 24 * 60 * 60 * 1000,
        isActive: true,
        stackable: false,
        createdBy: 'system'
      });

      codes.push(discount);
    }

    return codes;
  }

  // Generate random promotional code
  private generateRandomCode(prefix: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = prefix.toUpperCase().substr(0, 4);
    
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return code;
  }

  // Calculate combined discounts (if stackable)
  calculateStackedDiscounts(
    discountCodes: string[],
    userId: string,
    cartItems: Array<{ id: number; name: string; category: string; price: number; quantity: number }>
  ): Array<DiscountApplication | { error: string }> {
    const applications: Array<DiscountApplication | { error: string }> = [];
    let currentTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Apply discounts in order of value (highest first)
    const sortedCodes = discountCodes
      .map(code => this.discountCodes.get(code.toUpperCase()))
      .filter(discount => discount !== undefined)
      .sort((a, b) => {
        const aValue = a!.type === 'percentage' ? a!.value : a!.value / currentTotal * 100;
        const bValue = b!.type === 'percentage' ? b!.value : b!.value / currentTotal * 100;
        return bValue - aValue;
      });

    for (const discount of sortedCodes) {
      if (!discount) continue;

      // Check if this discount can be stacked
      if (!discount.stackable && applications.some(app => !('error' in app))) {
        applications.push({ error: `${discount.code} cannot be combined with other discounts` });
        continue;
      }

      // Apply discount to current total
      const updatedCartItems = cartItems.map(item => ({
        ...item,
        price: item.price * (currentTotal / cartItems.reduce((sum, ci) => sum + (ci.price * ci.quantity), 0))
      }));

      const application = await this.applyDiscountCode(discount.code, userId, updatedCartItems);
      
      if ('error' in application) {
        applications.push(application);
      } else {
        applications.push(application);
        currentTotal = application.finalAmount;
      }
    }

    return applications;
  }

  // Get discount analytics
  getDiscountAnalytics(): {
    totalCodes: number;
    activeCodes: number;
    totalUsage: number;
    totalDiscountGiven: number;
    topPerformingCodes: Array<{ code: string; usage: number; value: number }>;
    categoryPerformance: Record<string, number>;
  } {
    const allCodes = Array.from(this.discountCodes.values());
    const activeCodes = allCodes.filter(code => code.isActive);
    const totalUsage = allCodes.reduce((sum, code) => sum + code.usageCount, 0);
    
    // Estimate total discount given (simplified calculation)
    const totalDiscountGiven = allCodes.reduce((sum, code) => {
      const avgOrderValue = 50000; // Estimated average order value
      const avgDiscount = code.type === 'percentage' 
        ? avgOrderValue * (code.value / 100)
        : code.value;
      return sum + (code.usageCount * avgDiscount);
    }, 0);

    const topPerformingCodes = allCodes
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)
      .map(code => ({
        code: code.code,
        usage: code.usageCount,
        value: code.value
      }));

    // Category performance based on applicable categories
    const categoryPerformance: Record<string, number> = {};
    allCodes.forEach(code => {
      code.applicableCategories.forEach(category => {
        categoryPerformance[category] = (categoryPerformance[category] || 0) + code.usageCount;
      });
    });

    return {
      totalCodes: allCodes.length,
      activeCodes: activeCodes.length,
      totalUsage,
      totalDiscountGiven: Math.round(totalDiscountGiven),
      topPerformingCodes,
      categoryPerformance
    };
  }

  // Persist discount to storage
  private async persistDiscount(discount: DiscountCode): Promise<void> {
    try {
      // Convert Map to object for JSON serialization
      const serializable = {
        ...discount,
        customerUsage: Array.from(discount.customerUsage.entries())
      };
      
      localStorage.setItem(`discount_${discount.code}`, JSON.stringify(serializable));
    } catch (error) {
      console.error('Error persisting discount:', error);
    }
  }
}

export const discountSystem = new DiscountSystem();