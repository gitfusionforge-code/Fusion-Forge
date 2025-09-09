import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminAuthGuard, useAdminSession } from "@/components/admin/admin-auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import EnhancedSEOHead from "@/components/enhanced-seo-head";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Users, 
  Mail, 
  TrendingUp, 
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  Package,
  BarChart3,
  Settings,
  Plus,
  Edit,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Database,
  LineChart,
  Warehouse,
  Headphones,
  Tag
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { Inquiry, PcBuild, Order, Subscription } from "@shared/schema";
import AddPcBuildForm from "@/components/admin/add-pc-build-form";
import BusinessSettingsManager from "@/components/admin/business-settings-manager";
import AnalyticsDashboard from "@/components/admin/analytics-dashboard";
import ComprehensiveInventoryDashboard from "@/components/admin/comprehensive-inventory-dashboard";
import SupportManagementDashboard from "@/components/admin/support-management-dashboard";
import DiscountManagementDashboard from "@/components/admin/discount-management-dashboard";

function AdminContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [selectedBuild, setSelectedBuild] = useState<PcBuild | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [editingBuild, setEditingBuild] = useState<PcBuild | null>(null);
  const isMobile = useIsMobile();
  const [buildEditForm, setBuildEditForm] = useState({
    name: '',
    basePrice: 0,
    budgetRange: '',
    stockQuantity: 0,
    description: '',
    // PC Components
    processor: '',
    motherboard: '',
    ram: '',
    storage: '',
    gpu: '',
    casePsu: '',
    // Peripherals (for Full Set builds)
    monitor: '',
    keyboardMouse: '',
    mousePad: ''
  });
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { adminSessionReady } = useAdminSession();

  const { data: inquiries = [], isLoading: inquiriesLoading, error: inquiriesError } = useQuery<Inquiry[]>({
    queryKey: ["/api/inquiries"],
    enabled: adminSessionReady,
  });

  const { data: pcBuilds = [], isLoading: buildsLoading, error: buildsError } = useQuery<PcBuild[]>({
    queryKey: ["/api/builds"],
    enabled: adminSessionReady,
  });

  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: adminSessionReady,
  });

  // Maintenance Mode Query
  const { data: maintenanceModeSetting } = useQuery<{key: string, value: boolean | string, updatedAt: string}>({
    queryKey: ["/api/admin/settings/maintenanceMode"],
    enabled: adminSessionReady,
  });

  // Update local state when maintenance mode setting changes
  useEffect(() => {
    if (maintenanceModeSetting && maintenanceModeSetting.value !== undefined) {
      setMaintenanceMode(maintenanceModeSetting.value === 'true' || maintenanceModeSetting.value === true);
    }
  }, [maintenanceModeSetting]);

  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: adminSessionReady,
  });

  // Admin subscription queries
  const { data: allSubscriptions = [], isLoading: subscriptionsLoading, error: subscriptionsError } = useQuery<Subscription[]>({
    queryKey: ["/api/subscription/admin/all"],
    enabled: adminSessionReady,
  });

  // Use simple local state for low stock threshold (no API calls needed)
  // Handle threshold input change
  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLowStockThreshold(parseInt(value) || 5);
  };

  // Mutation to update inquiry status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/inquiries/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
      toast({
        title: "Status Updated",
        description: "Inquiry status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update inquiry status.",
        variant: "destructive",
      });
    }
  });


  // Mutation to toggle maintenance mode
  const toggleMaintenanceMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          key: 'maintenanceMode', 
          value: enabled.toString() 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update maintenance mode');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings/maintenanceMode'] });
      toast({
        title: "Maintenance Mode Updated",
        description: `Maintenance mode has been ${maintenanceMode ? 'disabled' : 'enabled'}.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update maintenance mode.",
        variant: "destructive",
      });
    }
  });

  // Handle maintenance mode toggle
  const handleMaintenanceToggle = (checked: boolean) => {
    setMaintenanceMode(checked);
    toggleMaintenanceMutation.mutate(checked);
  };

  // Mutation to update PC build stock
  const updateStockMutation = useMutation({
    mutationFn: async ({ id, stockQuantity }: { id: number; stockQuantity: number }) => {
      const response = await fetch(`/api/builds/${id}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stockQuantity }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update stock');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/builds'] });
      toast({
        title: "Stock Updated",
        description: "PC build stock has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update stock.",
        variant: "destructive",
      });
    }
  });

  // Filter inquiries based on search and filters
  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch = !searchQuery || 
      inquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.useCase.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBudget = budgetFilter === "all" || inquiry.budget === budgetFilter;
    const matchesStatus = statusFilter === "all" || (inquiry.status || "uncompleted") === statusFilter;
    
    return matchesSearch && matchesBudget && matchesStatus;
  });

  const handleStatusChange = async (inquiryId: number, newStatus: string) => {
    updateStatusMutation.mutate({ id: inquiryId, status: newStatus });
  };

  // Handle opening local email client with pre-filled details
  const handleSendEmail = (inquiry: Inquiry) => {
    const subject = encodeURIComponent(`Custom PC Build Quote - ${inquiry.name}`);
    const body = encodeURIComponent(`Dear ${inquiry.name},

Thank you for your interest in our custom PC building services. Based on your inquiry, here are the details we've received:

INQUIRY DETAILS:
• Budget Range: ${inquiry.budget}
• Use Case: ${inquiry.useCase}
• Customer Details: ${inquiry.email}
• Submitted: ${new Date(inquiry.createdAt).toLocaleDateString()}

REQUIREMENTS:
${inquiry.details}

RECOMMENDED CONFIGURATION:
[Please add your custom PC recommendation here based on their requirements]

PRICING & NEXT STEPS:
[Please add pricing details and next steps here]

We're excited to help you build the perfect PC for your needs. Please reply to this email if you have any questions or would like to proceed with the order.

Best regards,
FusionForge PCs Team

Contact: [Your Phone Number]
Website: [Your Website URL]
Email: [Your Business Email]`);
    
    const mailtoLink = `mailto:${inquiry.email}?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
    
    toast({
      title: "Email Client Opened",
      description: "Your default email app has been opened with pre-filled customer details.",
    });
  };

  const handleStockUpdate = async (buildId: number, newStock: number) => {
    // Validate the stock value before sending to server
    if (isNaN(newStock) || newStock < 0) {
      toast({
        title: "Invalid Stock Quantity",
        description: "Please enter a valid number (0 or greater).",
        variant: "destructive"
      });
      return;
    }
    
    updateStockMutation.mutate({ id: buildId, stockQuantity: newStock });
  };

  // Mutation to update PC build details
  const updateBuildMutation = useMutation({
    mutationFn: async ({ id, buildData }: { id: number; buildData: any }) => {
      const response = await fetch(`/api/builds/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update build');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/builds'] });
      toast({
        title: "Build Updated",
        description: "PC build has been updated successfully.",
      });
      setEditingBuild(null);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update PC build. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBuildUpdate = () => {
    if (!editingBuild) return;
    
    const buildData = {
      name: buildEditForm.name,
      basePrice: buildEditForm.basePrice,
      budgetRange: buildEditForm.budgetRange,
      stockQuantity: buildEditForm.stockQuantity,
      description: buildEditForm.description,
      // PC Components
      processor: buildEditForm.processor,
      motherboard: buildEditForm.motherboard,
      ram: buildEditForm.ram,
      storage: buildEditForm.storage,
      gpu: buildEditForm.gpu,
      casePsu: buildEditForm.casePsu,
      // Peripherals
      monitor: buildEditForm.monitor,
      keyboardMouse: buildEditForm.keyboardMouse,
      mousePad: buildEditForm.mousePad
    };
    
    updateBuildMutation.mutate({ id: editingBuild.id, buildData });
  };

  const formatDate = (dateInput: any) => {
    if (!dateInput) return 'No date available';
    
    let date: Date;
    
    // Handle different date formats from Firebase
    if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'object' && dateInput._seconds) {
      // Firebase timestamp object
      date = new Date(dateInput._seconds * 1000);
    } else if (typeof dateInput === 'number') {
      // Unix timestamp
      date = new Date(dateInput);
    } else {
      return 'Invalid date format';
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Mutation to update order status
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderStatus: status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Order Status Updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    }
  });

  const handleOrderStatusUpdate = async (orderId: number, newStatus: string) => {
    updateOrderStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  // Subscription management mutations
  const updateSubscriptionStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/subscription/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update subscription status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/admin/all'] });
      toast({
        title: "Subscription Updated",
        description: "Subscription status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update subscription status.",
        variant: "destructive",
      });
    }
  });

  const handleSubscriptionAction = (subscriptionId: string, action: string) => {
    updateSubscriptionStatusMutation.mutate({ id: subscriptionId, status: action });
  };

  // Queue-structured order sorting: prioritize pending/processing orders first
  const queuedOrders = [...orders].sort((a, b) => {
    const statusPriority = { 'pending': 1, 'processing': 2, 'paid': 3, 'completed': 4, 'cancelled': 5 };
    const priorityA = statusPriority[a.status as keyof typeof statusPriority] || 6;
    const priorityB = statusPriority[b.status as keyof typeof statusPriority] || 6;
    
    if (priorityA !== priorityB) return priorityA - priorityB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Export data function
  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const csvContent = [
      headers,
      ...data.map(row => Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Data exported to ${filename}.csv successfully.`,
    });
  };

  // Analytics calculations
  const analytics = {
    totalInquiries: inquiries.length,
    completedInquiries: inquiries.filter(i => i.status === "completed").length,
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status !== "completed" && o.status !== "cancelled").length,
    completedOrders: orders.filter(o => o.status === "completed").length,
    totalRevenue: orders.filter(o => o.status === "completed" || o.status === "paid").reduce((sum, order) => {
      const total = typeof order.total === 'string' ? order.total : String(order.total || 0);
      return sum + parseFloat(total.replace(/[^\d.]/g, '') || '0');
    }, 0),
    totalBuilds: pcBuilds.length,
    averagePrice: pcBuilds.length > 0 ? Math.round(pcBuilds.reduce((sum, build) => sum + build.basePrice, 0) / pcBuilds.length) : 0,
    lowStockBuilds: pcBuilds.filter(build => build.stockQuantity < 5).length,
    conversionRate: inquiries.length > 0 ? Math.round((inquiries.filter(i => i.status === "completed").length / inquiries.length) * 100) : 0,
    totalInventoryValue: pcBuilds.reduce((sum, build) => sum + (build.basePrice * build.stockQuantity), 0),
    newInquiriesToday: inquiries.filter(i => {
      const today = new Date().toDateString();
      const inquiryDate = new Date(i.createdAt).toDateString();
      return inquiryDate === today;
    }).length,
    newOrdersToday: orders.filter(o => {
      const today = new Date().toDateString();
      const orderDate = new Date(o.createdAt).toDateString();
      return orderDate === today;
    }).length,
    totalUsers: users.length,
    activeSubscriptions: allSubscriptions.filter(s => s.status === 'active').length,
    totalSubscriptionRevenue: allSubscriptions.filter(s => s.status === 'active').reduce((sum, sub) => sum + sub.basePrice, 0),
    newUsersToday: users.filter(user => {
      const today = new Date().toDateString();
      const userDate = new Date(user.createdAt).toDateString();
      return userDate === today;
    }).length,
    usersWithOrders: Array.from(new Set(orders.map(order => order.customerEmail))).length
  };

  return (
    <>
      <EnhancedSEOHead 
        title="Admin Dashboard - FusionForge PCs"
        description="Admin dashboard for managing FusionForge PCs orders and inquiries"
        noIndex={true}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold fusion-text-gradient flex items-center gap-3 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">Manage inventory, inquiries, and analytics</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="space-y-4">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Inventory
              </TabsTrigger>
              <TabsTrigger value="customers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Customers
              </TabsTrigger>
              <TabsTrigger value="support" className="flex items-center gap-2">
                <Headphones className="h-4 w-4" />
                Support
              </TabsTrigger>
              <TabsTrigger value="discounts" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Discounts
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Overview Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Total Revenue</p>
                      <p className="text-2xl font-bold text-blue-900">₹{analytics.totalRevenue.toLocaleString('en-IN')}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-xs text-blue-600 mt-2">From completed orders</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Total Orders</p>
                      <p className="text-2xl font-bold text-green-900">{analytics.totalOrders}</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-xs text-green-600 mt-2">{analytics.completedOrders} completed, {analytics.pendingOrders} pending</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 text-sm font-medium">Active Inquiries</p>
                      <p className="text-2xl font-bold text-orange-900">{analytics.totalInquiries}</p>
                    </div>
                    <Mail className="h-8 w-8 text-orange-600" />
                  </div>
                  <p className="text-xs text-orange-600 mt-2">{analytics.newInquiriesToday} new today</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">PC Builds</p>
                      <p className="text-2xl font-bold text-purple-900">{analytics.totalBuilds}</p>
                    </div>
                    <Package className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-xs text-purple-600 mt-2">Avg. ₹{analytics.averagePrice.toLocaleString('en-IN')}</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => setActiveTab('customers')}
                    className="h-auto p-4 bg-blue-600 hover:bg-blue-700"
                    data-testid="button-view-inquiries"
                  >
                    <div className="text-center">
                      <Mail className="h-6 w-6 mx-auto mb-2" />
                      <div className="text-sm font-medium">Review Inquiries</div>
                      <div className="text-xs opacity-80">{analytics.totalInquiries - analytics.completedInquiries} pending</div>
                    </div>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('orders')}
                    className="h-auto p-4 bg-green-600 hover:bg-green-700"
                    data-testid="button-view-orders"
                  >
                    <div className="text-center">
                      <ShoppingCart className="h-6 w-6 mx-auto mb-2" />
                      <div className="text-sm font-medium">Manage Orders</div>
                      <div className="text-xs opacity-80">{analytics.pendingOrders} pending</div>
                    </div>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('inventory')}
                    className="h-auto p-4 bg-orange-600 hover:bg-orange-700"
                    data-testid="button-view-inventory"
                  >
                    <div className="text-center">
                      <Package className="h-6 w-6 mx-auto mb-2" />
                      <div className="text-sm font-medium">Check Inventory</div>
                      <div className="text-xs opacity-80">{analytics.lowStockBuilds} low stock alerts</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{order.customerName}</p>
                          <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{order.total}</p>
                          <Badge className={`text-xs ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No recent orders</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    System Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.lowStockBuilds > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="text-sm font-medium text-red-800">Low Stock Alert</p>
                          <p className="text-xs text-red-600">{analytics.lowStockBuilds} PC builds running low on stock</p>
                        </div>
                      </div>
                    )}
                    {analytics.totalInquiries - analytics.completedInquiries > 5 && (
                      <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <Mail className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium text-orange-800">Pending Inquiries</p>
                          <p className="text-xs text-orange-600">{analytics.totalInquiries - analytics.completedInquiries} inquiries need attention</p>
                        </div>
                      </div>
                    )}
                    {analytics.pendingOrders > 10 && (
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <ShoppingCart className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Order Backlog</p>
                          <p className="text-xs text-yellow-600">{analytics.pendingOrders} orders pending processing</p>
                        </div>
                      </div>
                    )}
                    {analytics.lowStockBuilds === 0 && analytics.totalInquiries - analytics.completedInquiries <= 5 && analytics.pendingOrders <= 10 && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="h-5 w-5 bg-green-600 rounded-full flex items-center justify-center">
                          <div className="h-2 w-2 bg-white rounded-full"></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-800">All Systems Normal</p>
                          <p className="text-xs text-green-600">No critical alerts at this time</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>


          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Orders</p>
                      <p className="text-3xl font-bold text-deep-blue">{analytics.totalOrders}</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-tech-orange" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                      <p className="text-3xl font-bold text-orange-600">{analytics.pendingOrders}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed Orders</p>
                      <p className="text-3xl font-bold text-green-600">{analytics.completedOrders}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-3xl font-bold text-deep-blue">₹{analytics.totalRevenue.toLocaleString('en-IN')}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-tech-orange" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Orders Management</h2>
              </div>
              
              <div className="overflow-x-auto">
                {ordersLoading ? (
                  <div className="p-8 text-center">Loading order queue...</div>
                ) : ordersError ? (
                  <div className="p-8 text-center text-red-600">Failed to load order queue</div>
                ) : orders.length === 0 ? (
                  <div className="p-8 text-center text-gray-600">No orders in queue</div>
                ) : (
                  <div className="space-y-4 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">High Priority (Pending)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Medium Priority (Processing)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Completed</span>
                      </div>
                    </div>
                    
                    {/* Queue-style order list */}
                    {queuedOrders.map((order, index) => {
                      const priorityColor = 
                        order.status === 'pending' ? 'border-red-200 bg-red-50' :
                        order.status === 'processing' ? 'border-yellow-200 bg-yellow-50' :
                        order.status === 'paid' ? 'border-blue-200 bg-blue-50' :
                        order.status === 'completed' ? 'border-green-200 bg-green-50' :
                        'border-gray-200 bg-gray-50';
                      
                      const priorityDot = 
                        order.status === 'pending' ? 'bg-red-500' :
                        order.status === 'processing' ? 'bg-yellow-500' :
                        order.status === 'paid' ? 'bg-blue-500' :
                        order.status === 'completed' ? 'bg-green-500' :
                        'bg-gray-500';
                        
                      return (
                        <Card key={order.id} className={`${priorityColor} border-2 transition-all hover:shadow-md`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 ${priorityDot} rounded-full`}></div>
                                  <span className="font-medium text-sm text-gray-500">Queue #{index + 1}</span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">Order #{order.id}</div>
                                  <div className="text-sm text-gray-600">{order.customerName || 'Guest Customer'}</div>
                                  <div className="text-xs text-gray-500">{order.customerEmail}</div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="font-medium text-gray-900">₹{order.total}</div>
                                  <div className="text-xs text-gray-500">{JSON.parse(order.items || '[]')[0]?.build?.name || 'Order Items'}</div>
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(order.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Select
                                    key={`${order.id}-${order.status}`}
                                    value={order.status}
                                    onValueChange={(value) => handleOrderStatusUpdate(order.id, value)}
                                  >
                                    <SelectTrigger className="w-32 h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="processing">Processing</SelectItem>
                                      <SelectItem value="paid">Paid</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                      <DialogHeader>
                                        <DialogTitle>Order Details - #{order.id}</DialogTitle>
                                        <DialogDescription>
                                          View order information and payment details
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <label className="text-sm font-medium text-gray-700">Order Number</label>
                                            <p className="text-sm text-gray-900">{order.orderNumber}</p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium text-gray-700">Customer Name</label>
                                            <p className="text-sm text-gray-900">{order.customerName || 'Not provided'}</p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium text-gray-700">Customer Email</label>
                                            <p className="text-sm text-gray-900">{order.customerEmail || 'Not provided'}</p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium text-gray-700">Items</label>
                                            <p className="text-sm text-gray-900">{JSON.parse(order.items || '[]').length} items</p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium text-gray-700">Shipping Address</label>
                                            <p className="text-sm text-gray-900">{order.shippingAddress || 'Not provided'}</p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium text-gray-700">Total Amount</label>
                                            <p className="text-sm text-gray-900">{order.total}</p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium text-gray-700">Payment Method</label>
                                            <p className="text-sm text-gray-900 capitalize">{order.paymentMethod || 'Not specified'}</p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium text-gray-700">Order Status</label>
                                            <p className="text-sm text-gray-900 capitalize">{order.status}</p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium text-gray-700">Order Date</label>
                                            <p className="text-sm text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-700">Shipping Address</label>
                                          <p className="text-sm text-gray-900 mt-1">{order.shippingAddress || 'No shipping address provided'}</p>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>
                            </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                )}
              </div>
            </div>
          </TabsContent>


          {/* Customers Tab - Combined Users & Inquiries */}
          <TabsContent value="customers" className="space-y-6">
            <Tabs defaultValue="users" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="users">Registered Users</TabsTrigger>
                <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
              </TabsList>

              {/* Users Sub-tab */}
              <TabsContent value="users">
                <div className="space-y-6">
                  {/* Users Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Users className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="text-sm text-blue-600 font-medium">Total Users</p>
                            <p className="text-2xl font-bold text-blue-900">{users.length}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-8 w-8 text-green-600" />
                          <div>
                            <p className="text-sm text-green-600 font-medium">New Users Today</p>
                            <p className="text-2xl font-bold text-green-900">
                              {users.filter(user => {
                                const today = new Date().toDateString();
                                const userDate = new Date(user.createdAt).toDateString();
                                return userDate === today;
                              }).length}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <ShoppingCart className="h-8 w-8 text-orange-600" />
                          <div>
                            <p className="text-sm text-orange-600 font-medium">Users with Orders</p>
                            <p className="text-2xl font-bold text-orange-900">
                              {Array.from(new Set(orders.map(order => order.customerEmail))).length}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Users Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Registered Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        {usersLoading ? (
                          <div className="p-8 text-center">Loading users...</div>
                        ) : usersError ? (
                          <div className="p-8 text-center text-red-600">Failed to load users</div>
                        ) : users.length === 0 ? (
                          <div className="p-8 text-center text-gray-600">No users found</div>
                        ) : (
                          <table className="min-w-full">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USER</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CONTACT</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ORDERS</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">REGISTERED</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {users.map((user, index) => {
                                const userOrders = orders.filter(order => 
                                  order.customerEmail === user.email || order.userId === user.uid
                                );
                                const totalSpent = userOrders
                                  .filter(o => o.status === 'completed')
                                  .reduce((sum, order) => {
                                    const total = typeof order.total === 'string' ? order.total : String(order.total || 0);
                                    return sum + parseFloat(total.replace(/[^\d.]/g, '') || '0');
                                  }, 0);
                                
                                return (
                                  <tr key={user.uid || index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {user.displayName || 'No Name'}
                                        </div>
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-sm text-gray-900">
                                        {user.phone || 'No phone'}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {user.city ? `${user.city}${user.zipCode ? `, ${user.zipCode}` : ''}` : 'No location'}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-sm text-gray-900">{userOrders.length} orders</div>
                                      <div className="text-sm text-gray-500">
                                        {totalSpent > 0 ? `₹${totalSpent.toLocaleString('en-IN')} spent` : 'No purchases'}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-sm text-gray-500">
                                        {formatDate(user.createdAt)}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <Badge className={`text-xs ${
                                        userOrders.length > 0 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {userOrders.length > 0 ? 'Customer' : 'Registered'}
                                      </Badge>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Inquiries Sub-tab */}
              <TabsContent value="inquiries">
                <div className="space-y-6">
                  {/* Filters */}
                  <Card>
                    <CardContent className="p-6">
                      <div className={`${isMobile ? 'space-y-4' : 'flex flex-wrap gap-4 items-center'}`}>
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search inquiries..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`${isMobile ? 'flex-1' : 'w-64'}`}
                          />
                        </div>

                        <div className={`${isMobile ? 'grid grid-cols-2 gap-3' : 'flex gap-4 items-center'}`}>
                          <Select value={budgetFilter} onValueChange={setBudgetFilter}>
                            <SelectTrigger className={`${isMobile ? 'w-full' : 'w-40'}`}>
                              <Filter className="h-4 w-4 mr-2" />
                              <SelectValue placeholder="Budget" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Budgets</SelectItem>
                              <SelectItem value="₹30,000 - ₹50,000">₹30K - ₹50K</SelectItem>
                              <SelectItem value="₹50,000 - ₹75,000">₹50K - ₹75K</SelectItem>
                              <SelectItem value="₹75,000 - ₹1,00,000">₹75K - ₹100K</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className={`${isMobile ? 'w-full' : 'w-40'}`}>
                              <Filter className="h-4 w-4 mr-2" />
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="uncompleted">Uncompleted</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className={`text-sm text-gray-600 ${isMobile ? 'text-center' : 'flex items-center'}`}>
                          Showing {filteredInquiries.length} of {analytics.totalInquiries} inquiries
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Customer Inquiries Table */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Customer Inquiries</CardTitle>
                        <Button
                          onClick={() => exportToCSV(filteredInquiries, 'customer-inquiries')}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          data-testid="button-export-inquiries"
                        >
                          <Download className="h-4 w-4" />
                          Export CSV
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        {inquiriesLoading ? (
                          <div className="p-8 text-center">Loading inquiries...</div>
                        ) : inquiriesError ? (
                          <div className="p-8 text-center text-red-600">Failed to load inquiries</div>
                        ) : filteredInquiries.length === 0 ? (
                          <div className="p-8 text-center text-gray-600">No inquiries found</div>
                        ) : (
                          <table className="min-w-full">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CUSTOMER</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USE CASE</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {filteredInquiries.map((inquiry) => (
                                <tr key={inquiry.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{inquiry.name}</div>
                                      <div className="text-sm text-gray-500">{inquiry.email}</div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900">
                                      {inquiry.useCase === "gaming" && "Gaming and streaming"}
                                      {inquiry.useCase === "professional" && "Professional video editing and 3D work"}
                                      {inquiry.useCase === "creative" && "Content creation and gaming"}
                                      {inquiry.useCase === "office" && "Student productivity and light gaming"}
                                      {inquiry.useCase && !["gaming", "professional", "creative", "office"].includes(inquiry.useCase) && inquiry.useCase}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                      inquiry.status === "completed" 
                                        ? "bg-green-100 text-green-800" 
                                        : "bg-orange-100 text-orange-800"
                                    }`}>
                                      {inquiry.status === "completed" ? "Completed" : "Uncompleted"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center text-sm text-gray-500">
                                      <Clock className="h-4 w-4 mr-2" />
                                      {formatDate(inquiry.createdAt)}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            className="flex items-center gap-2 text-sm"
                                            onClick={() => setSelectedInquiry(inquiry)}
                                            data-testid={`button-view-inquiry-${inquiry.id}`}
                                          >
                                            <Eye className="h-4 w-4" />
                                            View
                                          </Button>
                                        </DialogTrigger>
                                      <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                          <DialogTitle>Inquiry Details</DialogTitle>
                                          <DialogDescription>
                                            Customer inquiry from {inquiry.name}
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label>Customer Name</Label>
                                              <p className="text-sm">{inquiry.name}</p>
                                            </div>
                                            <div>
                                              <Label>Email</Label>
                                              <p className="text-sm">{inquiry.email}</p>
                                            </div>
                                            <div>
                                              <Label>Phone</Label>
                                              <p className="text-sm">{inquiry.phone || 'Not provided'}</p>
                                            </div>
                                            <div>
                                              <Label>Budget</Label>
                                              <p className="text-sm">{inquiry.budget}</p>
                                            </div>
                                            <div>
                                              <Label>Use Case</Label>
                                              <p className="text-sm">{inquiry.useCase}</p>
                                            </div>
                                            <div>
                                              <Label>Status</Label>
                                              <p className="text-sm">{inquiry.status}</p>
                                            </div>
                                          </div>
                                          {inquiry.message && (
                                            <div>
                                              <Label>Message</Label>
                                              <p className="text-sm mt-1">{inquiry.message}</p>
                                            </div>
                                          )}
                                        </div>
                                      </DialogContent>
                                      </Dialog>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="flex items-center gap-2 text-sm bg-blue-50 hover:bg-blue-100"
                                        onClick={() => handleSendEmail(inquiry)}
                                        data-testid={`button-email-inquiry-${inquiry.id}`}
                                      >
                                        <Mail className="h-4 w-4" />
                                        Email
                                      </Button>
                                      <Select onValueChange={(value) => handleStatusChange(inquiry.id, value)}>
                                        <SelectTrigger className="w-32">
                                          <SelectValue placeholder="Update Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="uncompleted">Pending</SelectItem>
                                          <SelectItem value="completed">Completed</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Active Subscriptions</p>
                      <p className="text-2xl font-bold text-green-900">{analytics.activeSubscriptions}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-xs text-green-600 mt-2">Recurring customers</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Monthly Recurring Revenue</p>
                      <p className="text-2xl font-bold text-blue-900">₹{analytics.totalSubscriptionRevenue.toLocaleString('en-IN')}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-xs text-blue-600 mt-2">From active subscriptions</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">Total Subscriptions</p>
                      <p className="text-2xl font-bold text-purple-900">{allSubscriptions.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-xs text-purple-600 mt-2">All time created</p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Customer Subscriptions</h2>
                  <Button
                    onClick={() => exportToCSV(allSubscriptions, 'customer-subscriptions')}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    data-testid="button-export-subscriptions"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                {subscriptionsLoading ? (
                  <div className="p-8 text-center">Loading subscriptions...</div>
                ) : subscriptionsError ? (
                  <div className="p-8 text-center text-red-600">Failed to load subscriptions</div>
                ) : allSubscriptions.length === 0 ? (
                  <div className="p-8 text-center text-gray-600">No subscriptions found</div>
                ) : (
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CUSTOMER</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PLAN</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NEXT BILLING</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">REVENUE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allSubscriptions.map((subscription) => (
                        <tr key={subscription.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{subscription.userId}</div>
                              <div className="text-sm text-gray-500">ID: {subscription.id}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{subscription.planName}</div>
                            <div className="text-sm text-gray-500">{subscription.billingCycle}</div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge 
                              className={
                                subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                                subscription.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                subscription.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {subscription.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {subscription.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            ₹{subscription.basePrice.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="flex space-x-2">
                              {subscription.status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSubscriptionAction(subscription.id, 'paused')}
                                  data-testid={`button-pause-subscription-${subscription.id}`}
                                >
                                  Pause
                                </Button>
                              )}
                              {subscription.status === 'paused' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSubscriptionAction(subscription.id, 'active')}
                                  data-testid={`button-resume-subscription-${subscription.id}`}
                                >
                                  Resume
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleSubscriptionAction(subscription.id, 'cancelled')}
                                data-testid={`button-cancel-subscription-${subscription.id}`}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Handle view subscription details
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Business Settings Manager */}
            <BusinessSettingsManager />
            
            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Environment</label>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        import.meta.env.MODE === 'development' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <span className="text-sm text-gray-600 capitalize">
                        {import.meta.env.MODE || 'Production'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Firebase Project</label>
                    <span className="text-sm text-gray-600">
                      {import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Not configured'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Database Status</label>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-gray-600">Firebase Realtime Database Connected</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Payment Gateway</label>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-gray-600">Razorpay Active</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Management Tab (moved from settings) */}
          <TabsContent value="inventory-settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <h3 className="text-lg font-medium mb-4">Stock Management</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
                      <div className="flex items-center gap-4">
                        <Input 
                          type="number" 
                          value={lowStockThreshold}
                          onChange={handleThresholdChange}
                          className="w-32" 
                          data-testid="input-stock-threshold"
                          min="1"
                          max="50"
                        />
                        <span className="text-sm text-gray-600">items</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Alert when inventory drops below this number</p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Auto-reorder Notifications</label>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm text-gray-600">Enabled - Email alerts for low stock</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        defaultChecked 
                        className="rounded" 
                        data-testid="checkbox-email-alerts"
                      />
                      <label className="text-sm text-gray-600">Send email alerts for low stock</label>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>💡 How it works:</strong> When PC components or builds drop below the threshold, 
                        automatic email notifications are sent to your business email for quick restocking.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Additional Admin Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">System Maintenance</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Maintenance Mode</label>
                        <p className="text-xs text-gray-500">Temporarily disable customer access</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${maintenanceMode ? 'bg-red-500' : 'bg-green-500'}`}></div>
                          <span className="text-sm text-gray-600">{maintenanceMode ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <Switch 
                          checked={maintenanceMode}
                          onCheckedChange={handleMaintenanceToggle}
                          disabled={toggleMaintenanceMutation.isPending}
                          data-testid="switch-maintenance-mode"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">System Notifications</label>
                        <p className="text-xs text-gray-500">Admin alert system status</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm text-gray-600">Active</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Security Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Session Timeout</label>
                        <p className="text-xs text-gray-500">Admin session duration</p>
                      </div>
                      <span className="text-sm text-gray-600">4 hours</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Two-Factor Authentication</label>
                        <p className="text-xs text-gray-500">Enhanced admin security</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span className="text-sm text-gray-600">Recommended</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Performance Monitoring</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Error Tracking</label>
                        <p className="text-xs text-gray-500">Client-side error monitoring</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm text-gray-600">Active</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Performance Alerts</label>
                        <p className="text-xs text-gray-500">Core Web Vitals monitoring</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm text-gray-600">Enabled</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Dashboard Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>

          {/* Inventory Management Tab - Comprehensive */}
          <TabsContent value="inventory" className="space-y-6">
            <ComprehensiveInventoryDashboard />
          </TabsContent>

          {/* Support Management Tab */}
          <TabsContent value="support" className="space-y-6">
            <SupportManagementDashboard />
          </TabsContent>

          {/* Discounts Tab */}
          <TabsContent value="discounts" className="space-y-6">
            <DiscountManagementDashboard />
          </TabsContent>

          {/* Discount Management Tab */}
          <TabsContent value="discounts" className="space-y-6">
            <DiscountManagementDashboard />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Build Modal */}
      {editingBuild && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit PC Build: {editingBuild.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-900">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Build Name</label>
                    <Input
                      value={buildEditForm.name}
                      onChange={(e) => setBuildEditForm(prev => ({...prev, name: e.target.value}))}
                      placeholder="Enter build name"
                      data-testid="input-edit-build-name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Base Price (₹)</label>
                    <Input
                      type="number"
                      value={buildEditForm.basePrice}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setBuildEditForm(prev => ({...prev, basePrice: value}));
                      }}
                      placeholder="Enter base price"
                      data-testid="input-edit-build-price"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Budget Range</label>
                    <Input
                      value={buildEditForm.budgetRange}
                      onChange={(e) => setBuildEditForm(prev => ({...prev, budgetRange: e.target.value}))}
                      placeholder="e.g., ₹10,000 - ₹15,000"
                      data-testid="input-edit-build-budget"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Stock Quantity</label>
                    <Input
                      type="number"
                      min="0"
                      value={buildEditForm.stockQuantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setBuildEditForm(prev => ({...prev, stockQuantity: value}));
                      }}
                      placeholder="Enter stock quantity"
                      data-testid="input-edit-build-stock"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md resize-none"
                    rows={3}
                    value={buildEditForm.description}
                    onChange={(e) => setBuildEditForm(prev => ({...prev, description: e.target.value}))}
                    placeholder="Enter build description"
                    data-testid="textarea-edit-build-description"
                  />
                </div>
              </div>

              {/* PC Components */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-900">PC Components</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Processor (CPU)</label>
                    <Input
                      value={buildEditForm.processor}
                      onChange={(e) => setBuildEditForm(prev => ({...prev, processor: e.target.value}))}
                      placeholder="e.g., Intel Core i5-12400F"
                      data-testid="input-edit-processor"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Motherboard</label>
                    <Input
                      value={buildEditForm.motherboard}
                      onChange={(e) => setBuildEditForm(prev => ({...prev, motherboard: e.target.value}))}
                      placeholder="e.g., MSI B450M PRO-VDH MAX"
                      data-testid="input-edit-motherboard"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">RAM</label>
                    <Input
                      value={buildEditForm.ram}
                      onChange={(e) => setBuildEditForm(prev => ({...prev, ram: e.target.value}))}
                      placeholder="e.g., 16GB DDR4 3200MHz"
                      data-testid="input-edit-ram"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Storage</label>
                    <Input
                      value={buildEditForm.storage}
                      onChange={(e) => setBuildEditForm(prev => ({...prev, storage: e.target.value}))}
                      placeholder="e.g., 500GB NVMe SSD"
                      data-testid="input-edit-storage"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Graphics Card (GPU)</label>
                    <Input
                      value={buildEditForm.gpu}
                      onChange={(e) => setBuildEditForm(prev => ({...prev, gpu: e.target.value}))}
                      placeholder="e.g., NVIDIA RTX 4060 (optional)"
                      data-testid="input-edit-gpu"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Case & PSU</label>
                    <Input
                      value={buildEditForm.casePsu}
                      onChange={(e) => setBuildEditForm(prev => ({...prev, casePsu: e.target.value}))}
                      placeholder="e.g., Mid Tower + 650W PSU"
                      data-testid="input-edit-case-psu"
                    />
                  </div>
                </div>
              </div>

              {/* Peripherals (for Full Set builds) */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-900">Peripherals (Full Set Only)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Monitor</label>
                    <Input
                      value={buildEditForm.monitor}
                      onChange={(e) => setBuildEditForm(prev => ({...prev, monitor: e.target.value}))}
                      placeholder="e.g., 24 inch 1080p 144Hz (optional)"
                      data-testid="input-edit-monitor"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Keyboard & Mouse</label>
                    <Input
                      value={buildEditForm.keyboardMouse}
                      onChange={(e) => setBuildEditForm(prev => ({...prev, keyboardMouse: e.target.value}))}
                      placeholder="e.g., Mechanical Keyboard + Gaming Mouse (optional)"
                      data-testid="input-edit-keyboard-mouse"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Mouse Pad</label>
                    <Input
                      value={buildEditForm.mousePad}
                      onChange={(e) => setBuildEditForm(prev => ({...prev, mousePad: e.target.value}))}
                      placeholder="e.g., Gaming Mouse Pad (optional)"
                      data-testid="input-edit-mouse-pad"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button 
                  onClick={handleBuildUpdate}
                  disabled={!buildEditForm.name || buildEditForm.basePrice <= 0 || updateBuildMutation.isPending}
                  className="flex-1"
                  data-testid="button-save-build-changes"
                >
                  {updateBuildMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditingBuild(null)}
                  className="flex-1"
                  data-testid="button-cancel-build-edit"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

export default function Admin() {
  return (
    <AdminAuthGuard>
      <AdminContent />
    </AdminAuthGuard>
  );
}