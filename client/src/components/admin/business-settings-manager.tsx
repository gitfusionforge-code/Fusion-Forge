import { useState, useEffect } from 'react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, RefreshCw, Building2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface BusinessSettings {
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  businessGst: string;
  businessHours: string;
  companyName: string;
  companyWebsite: string;
}

export default function BusinessSettingsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<BusinessSettings>({
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    businessGst: '',
    businessHours: '',
    companyName: '',
    companyWebsite: '',
  });

  // Fetch business settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['/api/business-settings'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update business settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<BusinessSettings>) => {
      const response = await fetch('/api/business-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });
      
      if (!response.ok) {
        // Parse detailed error from backend
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || 'Failed to update settings';
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).details = errorData.details;
        throw error;
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Settings Updated',
        description: 'Business settings have been successfully updated.',
      });
      // Invalidate and refetch business settings
      queryClient.invalidateQueries({ queryKey: ['/api/business-settings'] });
      // Update form data with the response
      if (data.settings) {
        setFormData(data.settings);
      }
    },
    onError: (error: any) => {
      let title = 'Update Failed';
      let description = error.message || 'Failed to update business settings.';
      
      // Handle specific permission errors
      if (error.status === 403) {
        title = 'Permission Denied';
        description = 'Unable to save settings due to database permissions. Please contact system administrator.';
      } else if (error.status === 500) {
        title = 'Database Error';
        description = 'Settings could not be saved to the database. Please try again later.';
      }
      
      toast({
        title,
        description,
        variant: 'destructive',
      });
    },
  });

  // Update form data when settings are loaded
  useEffect(() => {
    if (settings && typeof settings === 'object') {
      setFormData(settings as BusinessSettings);
    }
  }, [settings]);

  const handleInputChange = (field: keyof BusinessSettings, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    updateSettingsMutation.mutate(formData);
  };

  const handleReset = () => {
    if (settings && typeof settings === 'object') {
      setFormData(settings as BusinessSettings);
      toast({
        title: 'Reset Complete',
        description: 'Form has been reset to saved values.',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading business settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-red-600">Failed to load business settings</p>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/business-settings'] })}
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Business Settings
        </CardTitle>
        <p className="text-sm text-gray-600">
          Manage your business contact information and details. These settings will be used throughout the website.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              placeholder="FusionForge PCs"
              data-testid="input-company-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyWebsite">Company Website</Label>
            <Input
              id="companyWebsite"
              value={formData.companyWebsite}
              onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
              placeholder="www.fusionforge.com"
              data-testid="input-company-website"
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="businessEmail">Business Email</Label>
            <Input
              id="businessEmail"
              type="email"
              value={formData.businessEmail}
              onChange={(e) => handleInputChange('businessEmail', e.target.value)}
              placeholder="fusionforgepcs@gmail.com"
              data-testid="input-business-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessPhone">Business Phone</Label>
            <Input
              id="businessPhone"
              value={formData.businessPhone}
              onChange={(e) => handleInputChange('businessPhone', e.target.value)}
              placeholder="+91 9363599577"
              data-testid="input-business-phone"
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="businessAddress">Business Address</Label>
          <Textarea
            id="businessAddress"
            value={formData.businessAddress}
            onChange={(e) => handleInputChange('businessAddress', e.target.value)}
            placeholder="58,Post Office Street , Palladam , TamilNadu , India"
            rows={3}
            data-testid="textarea-business-address"
          />
        </div>

        {/* Additional Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="businessGst">GST Number</Label>
            <Input
              id="businessGst"
              value={formData.businessGst}
              onChange={(e) => handleInputChange('businessGst', e.target.value)}
              placeholder="GST-NUMBER"
              data-testid="input-business-gst"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessHours">Business Hours</Label>
            <Input
              id="businessHours"
              value={formData.businessHours}
              onChange={(e) => handleInputChange('businessHours', e.target.value)}
              placeholder="9AM - 10PM Daily"
              data-testid="input-business-hours"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={updateSettingsMutation.isPending}
            className="flex-1"
            data-testid="button-save-settings"
          >
            {updateSettingsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={updateSettingsMutation.isPending}
            data-testid="button-reset-settings"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Information Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h4 className="font-medium text-blue-900 mb-2">Settings Sync</h4>
          <p className="text-sm text-blue-800">
            These settings will automatically update throughout your website including:
          </p>
          <ul className="text-sm text-blue-800 mt-2 list-disc list-inside">
            <li>Footer contact information</li>
            <li>FAQ page contact details</li>
            <li>Email templates and receipts</li>
            <li>Admin panel contact displays</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}