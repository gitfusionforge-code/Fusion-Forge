import { ref, get, set } from 'firebase/database';
import { database } from './firebase-realtime-storage';

interface BusinessSettings {
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  businessGst: string;
  businessHours: string;
  companyName: string;
  companyWebsite: string;
}

const SETTINGS_PATH = 'admin/settings';

// Default business settings - Use environment variables or configure in production
const DEFAULT_SETTINGS: BusinessSettings = {
  businessEmail: process.env.BUSINESS_EMAIL || 'contact@company.com',
  businessPhone: process.env.BUSINESS_PHONE || '+1-XXX-XXX-XXXX',
  businessAddress: process.env.BUSINESS_ADDRESS || 'Business Address Not Configured',
  businessGst: process.env.BUSINESS_GST || 'GST-NOT-SET',
  businessHours: process.env.BUSINESS_HOURS || '9AM - 6PM',
  companyName: process.env.COMPANY_NAME || 'Your Company Name',
  companyWebsite: process.env.COMPANY_WEBSITE || 'www.yourcompany.com',
};


// Load business settings from file
export async function loadBusinessSettings(): Promise<BusinessSettings> {
  try {
    const snapshot = await get(ref(database, SETTINGS_PATH));
    
    if (snapshot.exists()) {
      const settings = snapshot.val();
      // Ensure all required fields exist, merge with defaults if needed
      return { ...DEFAULT_SETTINGS, ...settings };
    }
  } catch (error: any) {
    console.error('Firebase permission issue, using local fallback:', error.message);
  }
  
  // Return default settings if Firebase access fails or data doesn't exist
  return DEFAULT_SETTINGS;
}

// Save business settings to file
export async function saveBusinessSettings(settings: BusinessSettings): Promise<void> {
  try {
    // Validate required fields
    const requiredFields = ['businessEmail', 'businessPhone', 'businessAddress', 'companyName'];
    for (const field of requiredFields) {
      if (!settings[field as keyof BusinessSettings]) {
        throw new Error(`${field} is required`);
      }
    }
    
    await set(ref(database, SETTINGS_PATH), settings);
    console.log('Business settings saved successfully to Firebase');
  } catch (error: any) {
    console.error('Error saving business settings to Firebase:', error);
    throw new Error('Failed to save business settings. Please try again.');
  }
}

// Initialize settings file with defaults if it doesn't exist
export async function initializeBusinessSettings(): Promise<void> {
  try {
    const snapshot = await get(ref(database, SETTINGS_PATH));
    
    if (!snapshot.exists()) {
      await saveBusinessSettings(DEFAULT_SETTINGS);
      console.log('Business settings initialized with default values in Firebase');
    }
  } catch (error) {
    console.error('Error initializing business settings:', error);
    // Silently continue with defaults if Firebase is not accessible
  }
}