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

  // Provide fallback values while loading or on error
  const businessSettings: BusinessSettings = settings || {
    businessEmail: 'fusionforgepcs@gmail.com',
    businessPhone: '+91 9363599577',
    businessAddress: '58,Post Office Street , Palladam , TamilNadu , India',
    businessGst: 'GST-NUMBER',
    businessHours: '9AM - 10PM Daily',
    companyName: 'FusionForge PCs',
    companyWebsite: 'www.fusionforge.com',
  };

  return {
    settings: businessSettings,
    isLoading,
    error,
    isReady: !isLoading && !error,
  };
}