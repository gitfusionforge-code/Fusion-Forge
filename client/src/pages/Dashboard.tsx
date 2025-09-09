import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { User, Package, Settings, ShoppingCart, Star, Clock, CheckCircle, Calendar } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isUpdating, setIsUpdating] = useState(false);

  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    zipCode: ""
  });

  // Mock data for orders and saved builds
  const mockOrders = [
    {
      id: "ORD-001",
      date: "2025-01-15",
      status: "delivered",
      total: "₹89,999",
      items: [
        { name: "Gaming Beast RTX 4070", quantity: 1, price: "₹89,999" }
      ]
    },
    {
      id: "ORD-002", 
      date: "2025-01-10",
      status: "processing",
      total: "₹154,999",
      items: [
        { name: "Content Creator Pro", quantity: 1, price: "₹154,999" }
      ]
    }
  ];

  const mockSavedBuilds = [
    {
      id: 1,
      name: "Gaming Beast RTX 4070",
      price: "₹89,999",
      category: "high-end",
      savedDate: "2025-01-12"
    },
    {
      id: 2,
      name: "Productivity Powerhouse",
      price: "₹64,999",
      category: "mid-range", 
      savedDate: "2025-01-08"
    }
  ];

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      // Simulate profile update
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Profile update successful
    } catch (error) {
      // Handle profile update error silently
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "processing":
        return <Clock className="h-4 w-4" />;
      case "shipped":
        return <Package className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-deep-blue">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user.displayName || user.email}!</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setLocation("/builds")}
            className="flex items-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Continue Shopping
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Saved Builds
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={profileData.displayName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        disabled
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profileData.city}
                        onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={profileData.zipCode}
                        onChange={(e) => setProfileData(prev => ({ ...prev, zipCode: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isUpdating} className="fusion-gradient text-white">
                    {isUpdating ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Order History</h3>
              {mockOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">Order {order.id}</h4>
                        <p className="text-sm text-gray-600">Placed on {order.date}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={`flex items-center gap-1 ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                        <div className="text-right">
                          <p className="font-semibold text-lg">{order.total}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.name} (Qty: {item.quantity})</span>
                          <span>{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Active Subscriptions</h3>
                <Button 
                  onClick={() => setLocation("/subscription-plans")}
                  className="fusion-gradient text-white hover:opacity-90"
                >
                  Browse Plans
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mock subscription data - replace with real data from API */}
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Monthly Premium</h4>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <p className="text-2xl font-bold text-orange-600 mb-2">₹42,749/month</p>
                    <p className="text-sm text-gray-600 mb-3">5% discount • Gaming Beast RTX 4070 (x1)</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Next billing: Jan 28, 2025</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setLocation("/subscriptions")}
                      >
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Empty state when no subscriptions */}
                <Card className="border-dashed border-2 border-gray-200">
                  <CardContent className="p-6 text-center">
                    <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <h4 className="font-semibold text-gray-600 mb-1">No Subscriptions Yet</h4>
                    <p className="text-sm text-gray-500 mb-3">
                      Get regular PC deliveries with exclusive discounts
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => setLocation("/subscription-plans")}
                      className="w-full"
                    >
                      View Plans
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Subscription Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Exclusive member discounts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Priority customer support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Flexible delivery schedule</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Saved Builds Tab */}
          <TabsContent value="saved">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Saved PC Builds</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockSavedBuilds.map((build) => (
                  <Card key={build.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">{build.name}</h4>
                        <Badge variant="secondary">{build.category}</Badge>
                      </div>
                      <p className="text-lg font-bold text-orange-600 mb-2">{build.price}</p>
                      <p className="text-xs text-gray-500 mb-3">Saved on {build.savedDate}</p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setLocation(`/builds/${build.id}`)}
                          className="flex-1"
                        >
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 fusion-gradient text-white"
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Account Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Email: {user.email}</p>
                    <p className="text-sm text-gray-600">Account Type: Firebase Authentication</p>
                    <p className="text-sm text-gray-600">Member since: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Preferences</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">Email notifications for order updates</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">Marketing emails and promotions</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">SMS notifications</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    variant="destructive" 
                    onClick={logout}
                    className="w-full md:w-auto"
                  >
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}