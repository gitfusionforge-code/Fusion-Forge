import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Trash2, Shield, Settings, Link } from "lucide-react";
import UserLayout from "@/components/user-layout";
import SEOHead from "@/components/enhanced-seo-head";
import { AccountLinking } from "@/components/auth/AccountLinking";

export default function ProfileSettings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showAccountLinking, setShowAccountLinking] = useState(false);
  
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    marketingEmails: false,
    orderUpdates: true,
    productRecommendations: true,
    newsletter: false
  });

  const handlePreferenceChange = (key: string, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Preference Updated",
      description: "Your notification preferences have been saved.",
    });
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <UserLayout>
      <SEOHead 
        title="Account Settings"
        description="Manage your account preferences and security settings"
      />
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-deep-blue">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account preferences and security</p>
        </div>

        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <p className="text-gray-600">{user?.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Account Type:</span>
                    <p className="text-gray-600">Firebase Authentication</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Email Verified:</span>
                    <p className="text-gray-600">{user?.emailVerified ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Member Since:</span>
                    <p className="text-gray-600">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Authentication Methods
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Manage how you sign in to your account
                  </p>
                </div>
                <Button 
                  onClick={() => setShowAccountLinking(true)}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Link className="h-4 w-4 mr-2" />
                  Manage Authentication
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Current sign-in methods for your account:</p>
                <ul className="mt-2 space-y-1 ml-4">
                  <li>• Email: {user?.email}</li>
                  {user?.providerData?.map((provider, index) => (
                    <li key={index}>
                      • {provider.providerId === 'google.com' ? 'Google' : provider.providerId}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications" className="text-base font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-gray-600">Receive general email notifications</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="order-updates" className="text-base font-medium">
                      Order Updates
                    </Label>
                    <p className="text-sm text-gray-600">Get notified about order status changes</p>
                  </div>
                  <Switch
                    id="order-updates"
                    checked={preferences.orderUpdates}
                    onCheckedChange={(checked) => handlePreferenceChange('orderUpdates', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketing-emails" className="text-base font-medium">
                      Marketing Emails
                    </Label>
                    <p className="text-sm text-gray-600">Receive promotional offers and deals</p>
                  </div>
                  <Switch
                    id="marketing-emails"
                    checked={preferences.marketingEmails}
                    onCheckedChange={(checked) => handlePreferenceChange('marketingEmails', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="product-recommendations" className="text-base font-medium">
                      Product Recommendations
                    </Label>
                    <p className="text-sm text-gray-600">Get personalized PC build suggestions</p>
                  </div>
                  <Switch
                    id="product-recommendations"
                    checked={preferences.productRecommendations}
                    onCheckedChange={(checked) => handlePreferenceChange('productRecommendations', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="newsletter" className="text-base font-medium">
                      Newsletter
                    </Label>
                    <p className="text-sm text-gray-600">Monthly updates and tech news</p>
                  </div>
                  <Switch
                    id="newsletter"
                    checked={preferences.newsletter}
                    onCheckedChange={(checked) => handlePreferenceChange('newsletter', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="outline"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {isLoggingOut ? "Logging out..." : "Sign Out"}
                </Button>
                
                <Button 
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </Button>
              </div>
              
              <p className="text-sm text-gray-600">
                Deleting your account will permanently remove all your data and cannot be undone.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Account Linking Modal */}
      <AccountLinking 
        isOpen={showAccountLinking}
        onClose={() => setShowAccountLinking(false)}
      />
    </UserLayout>
  );
}