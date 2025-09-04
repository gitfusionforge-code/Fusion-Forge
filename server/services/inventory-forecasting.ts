import { firebaseRealtimeStorage as storage } from '../firebase-realtime-storage';

interface SalesData {
  itemId: number;
  itemType: 'build' | 'component';
  quantitySold: number;
  date: string;
  revenue: number;
}

interface ForecastResult {
  itemId: number;
  itemType: 'build' | 'component';
  currentStock: number;
  predictedDemand: number;
  reorderPoint: number;
  suggestedOrderQuantity: number;
  daysUntilStockout: number;
  confidence: number;
}

interface SupplierNotification {
  supplierId: string;
  itemId: number;
  itemType: 'build' | 'component';
  itemName: string;
  currentStock: number;
  reorderPoint: number;
  suggestedQuantity: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimatedStockoutDate: string;
}

class InventoryForecastingService {
  // Moving average forecast algorithm
  private calculateMovingAverage(salesData: SalesData[], periods: number): number {
    if (salesData.length === 0) return 0;
    
    const recentSales = salesData.slice(-periods);
    const totalSold = recentSales.reduce((sum, sale) => sum + sale.quantitySold, 0);
    return totalSold / Math.min(periods, recentSales.length);
  }

  // Exponential smoothing forecast algorithm
  private calculateExponentialSmoothing(salesData: SalesData[], alpha: number = 0.3): number {
    if (salesData.length === 0) return 0;
    if (salesData.length === 1) return salesData[0].quantitySold;

    let forecast = salesData[0].quantitySold;
    for (let i = 1; i < salesData.length; i++) {
      forecast = alpha * salesData[i].quantitySold + (1 - alpha) * forecast;
    }
    return forecast;
  }

  // Seasonal adjustment based on historical patterns
  private calculateSeasonalAdjustment(salesData: SalesData[], currentMonth: number): number {
    const monthlyAverages = new Array(12).fill(0);
    const monthlyCounts = new Array(12).fill(0);

    salesData.forEach(sale => {
      const month = new Date(sale.date).getMonth();
      monthlyAverages[month] += sale.quantitySold;
      monthlyCounts[month]++;
    });

    // Calculate average for each month
    for (let i = 0; i < 12; i++) {
      monthlyAverages[i] = monthlyCounts[i] > 0 ? monthlyAverages[i] / monthlyCounts[i] : 0;
    }

    const overallAverage = monthlyAverages.reduce((sum, avg) => sum + avg, 0) / 12;
    const seasonalIndex = overallAverage > 0 ? monthlyAverages[currentMonth] / overallAverage : 1;
    
    return seasonalIndex;
  }

  // Advanced demand forecasting with multiple algorithms
  async forecastDemand(itemId: number, itemType: 'build' | 'component', forecastDays: number = 30): Promise<ForecastResult> {
    try {
      // Get historical sales data (last 12 months)
      const salesData = await this.getSalesHistory(itemId, itemType, 365);
      const currentStock = await this.getCurrentStock(itemId, itemType);

      if (salesData.length < 3) {
        // Insufficient data, use conservative estimate
        return {
          itemId,
          itemType,
          currentStock,
          predictedDemand: Math.max(1, currentStock * 0.1), // 10% of current stock as default
          reorderPoint: Math.max(5, currentStock * 0.2),
          suggestedOrderQuantity: Math.max(10, currentStock * 0.5),
          daysUntilStockout: currentStock > 0 ? Math.floor(currentStock / 0.1) : 0,
          confidence: 0.3
        };
      }

      // Calculate multiple forecasts
      const movingAvg7 = this.calculateMovingAverage(salesData, 7);
      const movingAvg30 = this.calculateMovingAverage(salesData, 30);
      const expSmoothing = this.calculateExponentialSmoothing(salesData);
      
      // Seasonal adjustment
      const currentMonth = new Date().getMonth();
      const seasonalFactor = this.calculateSeasonalAdjustment(salesData, currentMonth);

      // Weighted combination of forecasts
      const baseForecast = (movingAvg7 * 0.4 + movingAvg30 * 0.3 + expSmoothing * 0.3);
      const seasonalForecast = baseForecast * seasonalFactor;
      
      // Calculate for the forecast period
      const dailyDemand = seasonalForecast;
      const predictedDemand = dailyDemand * forecastDays;

      // Safety stock calculation (standard deviation of demand)
      const demandVariances = salesData.map(sale => Math.pow(sale.quantitySold - baseForecast, 2));
      const variance = demandVariances.reduce((sum, v) => sum + v, 0) / demandVariances.length;
      const stdDev = Math.sqrt(variance);
      const safetyStock = stdDev * 1.65; // 95% service level

      // Reorder point calculation
      const leadTimeDays = 7; // Assume 7-day lead time
      const leadTimeDemand = dailyDemand * leadTimeDays;
      const reorderPoint = Math.ceil(leadTimeDemand + safetyStock);

      // Economic Order Quantity (EOQ) for suggested order quantity
      const annualDemand = dailyDemand * 365;
      const orderingCost = 50; // Fixed ordering cost
      const holdingCostRate = 0.2; // 20% holding cost rate
      const itemCost = await this.getItemCost(itemId, itemType);
      const holdingCost = itemCost * holdingCostRate;
      
      const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost);
      const suggestedOrderQuantity = Math.max(Math.ceil(eoq), reorderPoint);

      // Days until stockout
      const daysUntilStockout = dailyDemand > 0 ? Math.floor(currentStock / dailyDemand) : 999;

      // Confidence based on data quality
      const confidence = Math.min(0.95, salesData.length / 100 + 0.3);

      return {
        itemId,
        itemType,
        currentStock,
        predictedDemand: Math.ceil(predictedDemand),
        reorderPoint,
        suggestedOrderQuantity,
        daysUntilStockout,
        confidence
      };

    } catch (error: any) {
      console.error('Error in demand forecasting:', error);
      throw error;
    }
  }

  // Generate supplier notifications for low stock items
  async generateSupplierNotifications(): Promise<SupplierNotification[]> {
    const notifications: SupplierNotification[] = [];
    
    try {
      // Get all low stock items
      const lowStockItems = await storage.getLowStockItems();
      
      // Process PC builds
      for (const build of lowStockItems.builds) {
        const forecast = await this.forecastDemand(build.id, 'build');
        const urgency = this.calculateUrgency(forecast.daysUntilStockout, forecast.currentStock);
        
        notifications.push({
          supplierId: `supplier_build_${build.id}`,
          itemId: build.id,
          itemType: 'build',
          itemName: build.name,
          currentStock: forecast.currentStock,
          reorderPoint: forecast.reorderPoint,
          suggestedQuantity: forecast.suggestedOrderQuantity,
          urgency,
          estimatedStockoutDate: new Date(Date.now() + forecast.daysUntilStockout * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      // Process components
      for (const component of lowStockItems.components) {
        const forecast = await this.forecastDemand(component.id, 'component');
        const urgency = this.calculateUrgency(forecast.daysUntilStockout, forecast.currentStock);
        
        notifications.push({
          supplierId: `supplier_component_${component.id}`,
          itemId: component.id,
          itemType: 'component',
          itemName: component.name,
          currentStock: forecast.currentStock,
          reorderPoint: forecast.reorderPoint,
          suggestedQuantity: forecast.suggestedOrderQuantity,
          urgency,
          estimatedStockoutDate: new Date(Date.now() + forecast.daysUntilStockout * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      return notifications.sort((a, b) => {
        const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      });

    } catch (error: any) {
      console.error('Error generating supplier notifications:', error);
      return [];
    }
  }

  private calculateUrgency(daysUntilStockout: number, currentStock: number): 'low' | 'medium' | 'high' | 'critical' {
    if (currentStock === 0) return 'critical';
    if (daysUntilStockout <= 3) return 'critical';
    if (daysUntilStockout <= 7) return 'high';
    if (daysUntilStockout <= 14) return 'medium';
    return 'low';
  }

  // Helper methods to get data
  private async getSalesHistory(itemId: number, itemType: 'build' | 'component', days: number): Promise<SalesData[]> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
      
      // Get orders from the date range
      const orders = await storage.getAllOrders();
      const salesData: SalesData[] = [];

      orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        if (orderDate >= startDate && orderDate <= endDate) {
          (order.items || []).forEach((item: any) => {
            if (item.build && item.build.id === itemId && itemType === 'build') {
              salesData.push({
                itemId,
                itemType,
                quantitySold: item.quantity,
                date: order.createdAt,
                revenue: parseFloat(item.build.basePrice.toString()) * item.quantity
              });
            }
          });
        }
      });

      return salesData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error: any) {
      console.error('Error getting sales history:', error);
      return [];
    }
  }

  private async getCurrentStock(itemId: number, itemType: 'build' | 'component'): Promise<number> {
    try {
      if (itemType === 'build') {
        const build = await storage.getPcBuildById(itemId);
        return build?.stockQuantity || 0;
      } else {
        // Component stock would need to be implemented
        return 0;
      }
    } catch (error: any) {
      console.error('Error getting current stock:', error);
      return 0;
    }
  }

  private async getItemCost(itemId: number, itemType: 'build' | 'component'): Promise<number> {
    try {
      if (itemType === 'build') {
        const build = await storage.getPcBuildById(itemId);
        return build?.basePrice || 1000; // Default cost
      } else {
        return 500; // Default component cost
      }
    } catch (error: any) {
      console.error('Error getting item cost:', error);
      return 1000;
    }
  }
}

export const inventoryForecastingService = new InventoryForecastingService();