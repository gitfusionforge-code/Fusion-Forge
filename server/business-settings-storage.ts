import fs from 'fs';
import path from 'path';

interface BusinessSettings {
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  businessGst: string;
  businessHours: string;
  companyName: string;
  companyWebsite: string;
}

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'business-settings.json');

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

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load business settings from file
export function loadBusinessSettings(): BusinessSettings {
  try {
    ensureDataDirectory();
    
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      const settings = JSON.parse(data);
      
      // Ensure all required fields exist, merge with defaults if needed
      return { ...DEFAULT_SETTINGS, ...settings };
    }
  } catch (error) {
    console.error('Error loading business settings from file:', error);
  }
  
  // Return default settings if file doesn't exist or on error
  return DEFAULT_SETTINGS;
}

// Save business settings to file
export function saveBusinessSettings(settings: BusinessSettings): void {
  try {
    ensureDataDirectory();
    
    // Validate required fields
    const requiredFields = ['businessEmail', 'businessPhone', 'businessAddress', 'companyName'];
    for (const field of requiredFields) {
      if (!settings[field as keyof BusinessSettings]) {
        throw new Error(`${field} is required`);
      }
    }
    
    const data = JSON.stringify(settings, null, 2);
    fs.writeFileSync(SETTINGS_FILE, data, 'utf8');
    console.log('Business settings saved successfully');
  } catch (error) {
    console.error('Error saving business settings to file:', error);
    throw error;
  }
}

// Initialize settings file with defaults if it doesn't exist
export function initializeBusinessSettings(): void {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      saveBusinessSettings(DEFAULT_SETTINGS);
      console.log('Business settings initialized with default values');
    }
  } catch (error) {
    console.error('Error initializing business settings:', error);
  }
}