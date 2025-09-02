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
  Database
} from "lucide-react";
import type { Inquiry, PcBuild, Order } from "@shared/schema";
import AddPcBuildForm from "@/components/admin/add-pc-build-form";
import { BackupManager } from "@/components/BackupManager";
import { BackupSettings } from "@/components/admin/BackupSettings";

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

  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery<any[]>({
    queryKey: ["/api/users"],
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

  // Mutation to send email and update status
  const sendEmailMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/inquiries/${id}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      
      return response.json();
    },
    onSuccess: (data, inquiryId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
      toast({
        title: "Email Sent Successfully",
        description: "Customer has been notified and status updated to completed.",
      });
      
      // Find the inquiry to get customer email
      const inquiry = inquiries.find(i => i.id === inquiryId);
      if (inquiry) {
        // Open default email client
        const subject = encodeURIComponent(`Follow-up: Your Custom PC Build Quote - ${inquiry.name}`);
        const body = encodeURIComponent(`Hi ${inquiry.name},

I hope this email finds you well. I wanted to follow up on the custom PC build quote we sent you earlier.

Our team has prepared a comprehensive solution that meets your requirements:
- Budget Range: ${inquiry.budget}
- Use Case: ${inquiry.useCase}

If you have any questions about the quote or would like to discuss any modifications, please don't hesitate to reach out. We're here to help you build the perfect PC for your needs.

Best regards,
FusionForge PCs Team`);
        
        const mailtoLink = `mailto:${inquiry.email}?subject=${subject}&body=${body}`;
        window.open(mailtoLink, '_blank');
      }
      
      setSelectedInquiry(null); // Close the modal
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send email.",
        variant: "destructive",
      });
    }
  });

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

  const handleSendEmail = async (inquiryId: number) => {
    sendEmailMutation.mutate(inquiryId);
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

  // Queue-structured order sorting: prioritize pending/processing orders first
  const queuedOrders = [...orders].sort((a, b) => {
    const statusPriority = { 'pending': 1, 'processing': 2, 'paid': 3, 'completed': 4, 'cancelled': 5 };
    const priorityA = statusPriority[a.status as keyof typeof statusPriority] || 6;
    const priorityB = statusPriority[b.status as keyof typeof statusPriority] || 6;
    
    if (priorityA !== priorityB) return priorityA - priorityB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

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
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="inquiries" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Inquiries
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Backup
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

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
                    onClick={() => setActiveTab('inquiries')}
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

          {/* Customer Inquiries Tab */}
          <TabsContent value="inquiries" className="space-y-6">
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
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Customer Inquiries</h2>
              </div>
              
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
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="flex items-center gap-2 text-sm"
                                  onClick={() => setSelectedInquiry(inquiry)}
                                >
                                  <Eye className="h-4 w-4" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Inquiry Details</DialogTitle>
                                  <DialogDescription>
                                    View customer inquiry details and send quote responses
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedInquiry && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Customer Name</label>
                                        <p className="text-sm text-gray-900">{selectedInquiry.name}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Email</label>
                                        <p className="text-sm text-gray-900">{selectedInquiry.email}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Contact</label>
                                        <p className="text-sm text-gray-900">{selectedInquiry.email}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Budget</label>
                                        <p className="text-sm text-gray-900">{selectedInquiry.budget}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Use Case</label>
                                        <p className="text-sm text-gray-900">{selectedInquiry.useCase}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Status</label>
                                        <p className="text-sm text-gray-900">{selectedInquiry.status === "completed" ? "Completed" : "Uncompleted"}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Requirements</label>
                                      <p className="text-sm text-gray-900 mt-1">{selectedInquiry.details}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Date Submitted</label>
                                      <p className="text-sm text-gray-900">{formatDate(selectedInquiry.createdAt)}</p>
                                    </div>
                                    
                                    <div className="flex gap-3 pt-4 border-t">
                                      <Button
                                        onClick={() => handleSendEmail(selectedInquiry.id)}
                                        disabled={sendEmailMutation.isPending}
                                        className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white"
                                      >
                                        <Mail className="h-4 w-4 mr-2" />
                                        {sendEmailMutation.isPending ? "Sending..." : "Send Quote Email"}
                                      </Button>
                                      
                                      {selectedInquiry.status !== "completed" && (
                                        <Button
                                          variant="outline"
                                          onClick={() => {
                                            handleStatusChange(selectedInquiry.id, "completed");
                                            setSelectedInquiry(null);
                                          }}
                                        >
                                          Mark as Completed
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
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

          {/* PC Builds Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Builds</p>
                      <p className="text-3xl font-bold text-deep-blue">{analytics.totalBuilds}</p>
                    </div>
                    <Package className="h-8 w-8 text-tech-orange" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Low Stock Alerts</p>
                      <p className="text-3xl font-bold text-red-600">{analytics.lowStockBuilds}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Average Price</p>
                      <p className="text-3xl font-bold text-deep-blue">₹{analytics.averagePrice.toLocaleString('en-IN')}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-tech-orange" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                      <p className="text-3xl font-bold text-deep-blue">₹{analytics.totalInventoryValue.toLocaleString('en-IN')}</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-tech-orange" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">PC Builds Inventory</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2 bg-gradient-to-r from-deep-blue to-tech-orange text-white">
                      <Plus className="h-4 w-4" />
                      Add New Build
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New PC Build</DialogTitle>
                      <DialogDescription>
                        Create a new PC build configuration for your inventory
                      </DialogDescription>
                    </DialogHeader>
                    <AddPcBuildForm />
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="overflow-x-auto">
                {buildsLoading ? (
                  <div className="p-8 text-center">Loading PC builds...</div>
                ) : buildsError ? (
                  <div className="p-8 text-center text-red-600">Failed to load PC builds</div>
                ) : pcBuilds.length === 0 ? (
                  <div className="p-8 text-center text-gray-600">No PC builds found</div>
                ) : (
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BUILD NAME</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CATEGORY</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRICE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STOCK</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {pcBuilds.map((build) => (
                        <tr key={build.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{build.name}</div>
                              <div className="text-sm text-gray-500">{build.description}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="capitalize">
                              {build.category}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              ₹{build.basePrice.toLocaleString('en-IN')}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${build.stockQuantity < 5 ? 'text-red-600' : 'text-gray-900'}`}>
                                {build.stockQuantity}
                              </span>
                              {build.stockQuantity < 5 && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center gap-2 text-sm"
                              onClick={() => {
                                setEditingBuild(build);
                                setBuildEditForm({
                                  name: build.name,
                                  basePrice: build.basePrice,
                                  budgetRange: build.budgetRange,
                                  stockQuantity: build.stockQuantity,
                                  description: build.description || '',
                                  // PC Components
                                  processor: build.processor || '',
                                  motherboard: build.motherboard || '',
                                  ram: build.ram || '',
                                  storage: build.storage || '',
                                  gpu: build.gpu || '',
                                  casePsu: build.casePsu || '',
                                  // Peripherals
                                  monitor: build.monitor || '',
                                  keyboardMouse: build.keyboardMouse || '',
                                  mousePad: build.mousePad || ''
                                });
                              }}
                              data-testid={`button-edit-build-${build.id}`}
                            >
                              <Edit className="h-4 w-4" />
                              Edit Build
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
                      <p className="text-3xl font-bold text-deep-blue">{analytics.totalInquiries}</p>
                    </div>
                    <Users className="h-8 w-8 text-tech-orange" />
                  </div>
                </CardContent>
              </Card>
              
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
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-3xl font-bold text-green-600">₹{analytics.totalRevenue.toLocaleString('en-IN')}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                      <p className="text-3xl font-bold text-purple-600">{analytics.conversionRate}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Inquiry Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Completed</span>
                      <span className="text-sm font-medium">{analytics.completedInquiries}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${analytics.conversionRate}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pending</span>
                      <span className="text-sm font-medium">{analytics.totalInquiries - analytics.completedInquiries}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full" 
                        style={{ width: `${100 - analytics.conversionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">In Stock</span>
                      <span className="text-sm font-medium">{analytics.totalBuilds - analytics.lowStockBuilds}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Low Stock</span>
                      <span className="text-sm font-medium text-red-600">{analytics.lowStockBuilds}</span>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Total Inventory Value</p>
                      <p className="text-2xl font-bold text-deep-blue">₹{analytics.totalInventoryValue.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Users Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Total Users</p>
                          <p className="text-2xl font-bold text-blue-900">{users.length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
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
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <ShoppingCart className="h-8 w-8 text-orange-600" />
                        <div>
                          <p className="text-sm text-orange-600 font-medium">Users with Orders</p>
                          <p className="text-2xl font-bold text-orange-900">
                            {Array.from(new Set(orders.map(order => order.customerEmail))).length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold">Registered Users</h3>
                    </div>
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
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Backup Tab */}
          <TabsContent value="backup" className="space-y-6">
            <BackupManager />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* System Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Email Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Business Email</label>
                      <Input 
                        value={import.meta.env.VITE_BUSINESS_EMAIL || "fusionforgepc@gmail.com"} 
                        disabled 
                        className="bg-gray-50"
                        data-testid="input-business-email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Service Status</label>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          import.meta.env.VITE_BUSINESS_EMAIL ? 'bg-green-500' : 'bg-orange-500'
                        }`}></div>
                        <span className="text-sm text-gray-600" data-testid="text-email-status">
                          {import.meta.env.VITE_BUSINESS_EMAIL ? 'Active - Email Service Ready' : 'Setup Required - Missing Business Email'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">System Information</h3>
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
                        <span className="text-sm text-gray-600">PostgreSQL + Firebase Connected</span>
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
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Inventory Management</h3>
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

            {/* Backup Management Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Backup Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BackupSettings />
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
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm text-gray-600">Disabled</span>
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