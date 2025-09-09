import { inventoryForecastingService } from './inventory-forecasting';
import { sendEmail } from '../email-service';

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  contactPerson: string;
  leadTimeDays: number;
  minimumOrderQuantity: number;
  paymentTerms: string;
  isActive: boolean;
}

interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  urgencyLevels: ('low' | 'medium' | 'high' | 'critical')[];
  frequency: 'immediate' | 'daily' | 'weekly';
}

class SupplierNotificationService {
  private suppliers: Map<string, Supplier> = new Map();
  private notificationPreferences: Map<string, NotificationPreferences> = new Map();

  constructor() {
    this.initializeSuppliers();
  }

  private initializeSuppliers() {
    // Default suppliers (in production, this would come from database)
    const defaultSuppliers: Supplier[] = [
      {
        id: 'supplier_001',
        name: 'TechSource Components',
        email: 'orders@techsource.com',
        phone: '+91-9876543210',
        contactPerson: 'Rajesh Kumar',
        leadTimeDays: 5,
        minimumOrderQuantity: 10,
        paymentTerms: '30 days',
        isActive: true
      },
      {
        id: 'supplier_002',
        name: 'Digital Hardware Solutions',
        email: 'procurement@digitalhw.com',
        phone: '+91-9876543211',
        contactPerson: 'Priya Sharma',
        leadTimeDays: 7,
        minimumOrderQuantity: 5,
        paymentTerms: '45 days',
        isActive: true
      },
      {
        id: 'supplier_003',
        name: 'PC Components India',
        email: 'sales@pccomponents.in',
        phone: '+91-9876543212',
        contactPerson: 'Amit Singh',
        leadTimeDays: 3,
        minimumOrderQuantity: 20,
        paymentTerms: '15 days',
        isActive: true
      }
    ];

    defaultSuppliers.forEach(supplier => {
      this.suppliers.set(supplier.id, supplier);
      // Default notification preferences
      this.notificationPreferences.set(supplier.id, {
        emailEnabled: true,
        smsEnabled: false,
        urgencyLevels: ['medium', 'high', 'critical'],
        frequency: 'immediate'
      });
    });
  }

  // Send automated reorder notifications
  async sendReorderNotifications(): Promise<{
    totalNotifications: number;
    sentSuccessfully: number;
    errors: Array<{ supplierId: string; error: string }>;
  }> {
    const result = {
      totalNotifications: 0,
      sentSuccessfully: 0,
      errors: [] as Array<{ supplierId: string; error: string }>
    };

    try {
      // Get supplier notifications from forecasting service
      const notifications = await inventoryForecastingService.generateSupplierNotifications();
      result.totalNotifications = notifications.length;

      // Group notifications by supplier
      const supplierNotifications = new Map<string, typeof notifications>();
      notifications.forEach(notification => {
        const supplierId = this.mapItemToSupplier(notification.itemId, notification.itemType);
        if (!supplierNotifications.has(supplierId)) {
          supplierNotifications.set(supplierId, []);
        }
        supplierNotifications.get(supplierId)!.push(notification);
      });

      // Send notifications to each supplier
      for (const [supplierId, supplierItems] of Array.from(supplierNotifications.entries())) {
        try {
          const supplier = this.suppliers.get(supplierId);
          const preferences = this.notificationPreferences.get(supplierId);

          if (supplier && preferences && preferences.emailEnabled) {
            // Filter notifications based on urgency preferences
            const filteredItems = supplierItems.filter((item: any) => 
              preferences.urgencyLevels.includes(item.urgency)
            );

            if (filteredItems.length > 0) {
              await this.sendSupplierEmail(supplier, filteredItems);
              result.sentSuccessfully++;
            }
          }
        } catch (error: any) {
          result.errors.push({
            supplierId,
            error: error.message || 'Unknown error'
          });
        }
      }

      return result;

    } catch (error: any) {
      console.error('Error sending reorder notifications:', error);
      result.errors.push({
        supplierId: 'system',
        error: error.message || 'System error'
      });
      return result;
    }
  }

  // Map items to suppliers (in production, this would be a database lookup)
  private mapItemToSupplier(itemId: number, itemType: 'build' | 'component'): string {
    // Simple mapping logic - in production, this would be based on actual supplier relationships
    const hash = (itemId + itemType.length) % 3;
    const supplierIds = ['supplier_001', 'supplier_002', 'supplier_003'];
    return supplierIds[hash];
  }

  // Send email notification to supplier
  private async sendSupplierEmail(supplier: Supplier, notifications: any[]): Promise<void> {
    const totalValue = notifications.reduce((sum, n) => sum + (n.suggestedQuantity * 1000), 0); // Estimate
    const criticalItems = notifications.filter(n => n.urgency === 'critical').length;
    const highPriorityItems = notifications.filter(n => n.urgency === 'high').length;

    const emailSubject = `Urgent Reorder Request - ${notifications.length} Items Need Restocking`;

    const itemRows = notifications.map(notification => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 8px; border: 1px solid #ddd;">${notification.itemName}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${notification.currentStock}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${notification.reorderPoint}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${notification.suggestedQuantity}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
          <span style="padding: 4px 8px; border-radius: 4px; color: white; background-color: ${
            notification.urgency === 'critical' ? '#dc3545' :
            notification.urgency === 'high' ? '#fd7e14' :
            notification.urgency === 'medium' ? '#ffc107' : '#28a745'
          };">
            ${notification.urgency.toUpperCase()}
          </span>
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${
          new Date(notification.estimatedStockoutDate).toLocaleDateString()
        }</td>
      </tr>
    `).join('');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">🚨 Urgent Reorder Request</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">FusionForge PCs Inventory Alert</p>
        </div>

        <div style="padding: 30px; background-color: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Dear ${supplier.contactPerson},</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            We have identified <strong>${notifications.length} items</strong> that require immediate restocking based on our 
            inventory forecasting analysis. Please review the details below and process the reorder as soon as possible.
          </p>

          <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="margin: 0 0 15px 0; color: #dc3545;">⚠️ Priority Summary</h3>
            <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
              <div style="text-align: center; margin: 10px;">
                <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${criticalItems}</div>
                <div style="font-size: 12px; color: #666;">Critical Items</div>
              </div>
              <div style="text-align: center; margin: 10px;">
                <div style="font-size: 24px; font-weight: bold; color: #fd7e14;">${highPriorityItems}</div>
                <div style="font-size: 12px; color: #666;">High Priority</div>
              </div>
              <div style="text-align: center; margin: 10px;">
                <div style="font-size: 24px; font-weight: bold; color: #28a745;">₹${totalValue.toLocaleString()}</div>
                <div style="font-size: 12px; color: #666;">Est. Order Value</div>
              </div>
            </div>
          </div>

          <h3 style="color: #333; margin: 30px 0 15px 0;">📋 Detailed Reorder List</h3>
          
          <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <thead style="background-color: #667eea; color: white;">
              <tr>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Item Name</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Current Stock</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Reorder Point</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Suggested Qty</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Urgency</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Est. Stockout</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h4 style="margin: 0 0 10px 0; color: #1976d2;">📞 Contact Information</h4>
            <p style="margin: 5px 0; color: #555;">
              <strong>Lead Time:</strong> ${supplier.leadTimeDays} days<br>
              <strong>Minimum Order:</strong> ${supplier.minimumOrderQuantity} units<br>
              <strong>Payment Terms:</strong> ${supplier.paymentTerms}
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 14px; color: #666; margin: 0;">
              Please confirm receipt of this order and provide an estimated delivery date.<br>
              For urgent inquiries, contact us immediately via our support system
            </p>
          </div>
        </div>

        <div style="background-color: #333; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">
            This is an automated notification from FusionForge PCs Inventory Management System<br>
            Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: supplier.email,
        from: process.env.BUSINESS_EMAIL || 'noreply@company.com',
        subject: emailSubject,
        html: emailHtml
      });

      console.log(`Reorder notification sent to ${supplier.name} (${supplier.email})`);

    } catch (error) {
      console.error(`Failed to send notification to ${supplier.name}:`, error);
      throw error;
    }
  }

  // Get supplier information
  getSupplier(supplierId: string): Supplier | undefined {
    return this.suppliers.get(supplierId);
  }

  // Update notification preferences
  updateNotificationPreferences(supplierId: string, preferences: Partial<NotificationPreferences>): boolean {
    const current = this.notificationPreferences.get(supplierId);
    if (current) {
      this.notificationPreferences.set(supplierId, { ...current, ...preferences });
      return true;
    }
    return false;
  }

  // Schedule automatic notifications
  startAutomaticNotifications() {
    // Run every 6 hours
    setInterval(async () => {
      try {
        console.log('Running automatic supplier notifications...');
        const result = await this.sendReorderNotifications();
        console.log(`Automatic notifications completed: ${result.sentSuccessfully}/${result.totalNotifications} sent`);
        if (result.errors.length > 0) {
          console.error('Notification errors:', result.errors);
        }
      } catch (error) {
        console.error('Error in automatic notifications:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 hours

    console.log('Automatic supplier notifications scheduled every 6 hours');
  }
}

export const supplierNotificationService = new SupplierNotificationService();