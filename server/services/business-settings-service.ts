import { db } from '../db';
import { businessSettings } from '@shared/drizzle-schema';
import { eq } from 'drizzle-orm';

export interface BusinessSettingsData {
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  businessGst: string;
  businessHours: string;
  companyName: string;
  companyWebsite: string;
}

export class BusinessSettingsService {
  
  async getBusinessSettings(): Promise<BusinessSettingsData> {
    try {
      const settings = await db.select().from(businessSettings);
      
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);

      return {
        businessEmail: settingsMap.businessEmail || 'fusionforgepcs@gmail.com',
        businessPhone: settingsMap.businessPhone || '+91 9363599577',
        businessAddress: settingsMap.businessAddress || '58,Post Office Street , Palladam , TamilNadu , India',
        businessGst: settingsMap.businessGst || 'GST-NUMBER',
        businessHours: settingsMap.businessHours || '9AM - 10PM Daily',
        companyName: settingsMap.companyName || 'FusionForge PCs',
        companyWebsite: settingsMap.companyWebsite || 'www.fusionforge.com',
      };
    } catch (error) {
      console.error('Error fetching business settings:', error);
      // Return defaults if database fails
      return {
        businessEmail: 'fusionforgepcs@gmail.com',
        businessPhone: '+91 9363599577',
        businessAddress: '58,Post Office Street , Palladam , TamilNadu , India',
        businessGst: 'GST-NUMBER',
        businessHours: '9AM - 10PM Daily',
        companyName: 'FusionForge PCs',
        companyWebsite: 'www.fusionforge.com',
      };
    }
  }

  async updateBusinessSettings(settings: Partial<BusinessSettingsData>): Promise<boolean> {
    try {
      for (const [key, value] of Object.entries(settings)) {
        if (value !== undefined && value !== null) {
          const existingSetting = await db
            .select()
            .from(businessSettings)
            .where(eq(businessSettings.key, key))
            .limit(1);

          if (existingSetting.length > 0) {
            await db
              .update(businessSettings)
              .set({ value, updatedAt: new Date() })
              .where(eq(businessSettings.key, key));
          } else {
            await db
              .insert(businessSettings)
              .values({ key, value });
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Error updating business settings:', error);
      return false;
    }
  }

  async seedDefaultSettings(): Promise<void> {
    try {
      const defaultSettings = {
        businessEmail: 'fusionforgepcs@gmail.com',
        businessPhone: '+91 9363599577',
        businessAddress: '58,Post Office Street , Palladam , TamilNadu , India',
        businessGst: 'GST-NUMBER',
        businessHours: '9AM - 10PM Daily',
        companyName: 'FusionForge PCs',
        companyWebsite: 'www.fusionforge.com',
      };

      for (const [key, value] of Object.entries(defaultSettings)) {
        const existing = await db
          .select()
          .from(businessSettings)
          .where(eq(businessSettings.key, key))
          .limit(1);

        if (existing.length === 0) {
          await db
            .insert(businessSettings)
            .values({ key, value });
        }
      }
    } catch (error) {
      console.error('Error seeding default settings:', error);
    }
  }
}

export const businessSettingsService = new BusinessSettingsService();