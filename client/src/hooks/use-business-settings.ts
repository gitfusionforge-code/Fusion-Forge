import { useQuery } from '@tanstack/react-query';

export interface BusinessSettings {
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  businessGst: string;
  businessHours: string;
  companyName: string;
  companyWebsite: string;
}

export function useBusinessSettings() {
  const { data: settings, isLoading, error } = useQuery<BusinessSettings>({
    queryKey: ['/api/business-settings'],
    staleTime: 10 * 60 * 1000, // 10 minutes - business settings don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });

  // Provide generic fallback values while loading or on error
  const businessSettings: BusinessSettings = settings || {
    businessEmail: 'contact@company.com',
    businessPhone: '+1-XXX-XXX-XXXX',
    businessAddress: 'Please configure business address',
    businessGst: 'GST-NOT-SET',
    businessHours: '9AM - 6PM',
    companyName: 'Your Company Name',
    companyWebsite: 'www.yourcompany.com',
  };

  return {
    settings: businessSettings,
    isLoading,
    error,
    isReady: !isLoading && !error,
  };
}