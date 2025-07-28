import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminAuthGuard } from "@/components/admin/admin-auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EnhancedSEOHead from "@/components/enhanced-seo-head";
import { useToast } from "@/hooks/use-toast";
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
  ShoppingCart
} from "lucide-react";
import type { Inquiry, PcBuild, Order } from "@shared/schema";
import AddPcBuildForm from "@/components/admin/add-pc-build-form";

export default function Admin() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [selectedBuild, setSelectedBuild] = useState<PcBuild | null>(null);
  const [activeTab, setActiveTab] = useState("inquiries");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: inquiries = [], isLoading: inquiriesLoading, error: inquiriesError } = useQuery<Inquiry[]>({
    queryKey: ["/api/inquiries"],
  });

  const { data: pcBuilds = [], isLoading: buildsLoading, error: buildsError } = useQuery<PcBuild[]>({
    queryKey: ["/api/builds"],
  });

  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

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
    updateStockMutation.mutate({ id: buildId, stockQuantity: newStock });
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

  // Analytics calculations
  const analytics = {
    totalInquiries: inquiries.length,
    completedInquiries: inquiries.filter(i => i.status === "completed").length,
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === "pending").length,
    completedOrders: orders.filter(o => o.status === "completed").length,
    totalRevenue: orders.filter(o => o.status === "completed").reduce((sum, order) => {
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
    }).length
  };

  return (
    <AdminAuthGuard>
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="inquiries" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Customer Inquiries
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              PC Builds Inventory
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Customer Inquiries Tab */}
          <TabsContent value="inquiries" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search inquiries..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64"
                    />
                  </div>

                  <Select value={budgetFilter} onValueChange={setBudgetFilter}>
                    <SelectTrigger className="w-40">
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
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="uncompleted">Uncompleted</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="text-sm text-gray-600 flex items-center">
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
                  <div className="p-8 text-center">Loading orders...</div>
                ) : ordersError ? (
                  <div className="p-8 text-center text-red-600">Failed to load orders</div>
                ) : orders.length === 0 ? (
                  <div className="p-8 text-center text-gray-600">No orders found</div>
                ) : (
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ORDER ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CUSTOMER</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BUILD</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AMOUNT</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {order.customerName || 'Guest Customer'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.customerEmail || 'No email provided'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{JSON.parse(order.items || '[]')[0]?.build?.name || 'Order Items'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{order.total}</div>
                          </td>
                          <td className="px-6 py-4">
                            <Select
                              key={`${order.id}-${order.status}`}
                              value={order.status}
                              onValueChange={(value) => handleOrderStatusUpdate(order.id, value)}
                            >
                              <SelectTrigger className="w-36 h-9 text-sm border border-gray-300 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <SelectValue>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    order.status === "completed" 
                                      ? "bg-green-100 text-green-800" 
                                      : order.status === "processing"
                                      ? "bg-blue-100 text-blue-800"
                                      : order.status === "paid"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : order.status === "cancelled"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-orange-100 text-orange-800"
                                  }`}>
                                    {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                                  </span>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                <SelectItem value="pending" className="hover:bg-orange-50 focus:bg-orange-50">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    Pending
                                  </span>
                                </SelectItem>
                                <SelectItem value="processing" className="hover:bg-blue-50 focus:bg-blue-50">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Processing
                                  </span>
                                </SelectItem>
                                <SelectItem value="completed" className="hover:bg-green-50 focus:bg-green-50">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Completed
                                  </span>
                                </SelectItem>
                                <SelectItem value="cancelled" className="hover:bg-red-50 focus:bg-red-50">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Cancelled
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-2" />
                              {formatDate(order.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Details
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
                                      <p className="text-sm text-gray-900">{formatDate(order.createdAt)}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Shipping Address</label>
                                    <p className="text-sm text-gray-900 mt-1">{order.shippingAddress || 'No shipping address provided'}</p>
                                  </div>
                                </div>
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
                              <Input
                                type="number"
                                min="0"
                                value={build.stockQuantity}
                                onChange={(e) => handleStockUpdate(build.id, parseInt(e.target.value))}
                                className={`w-20 ${build.stockQuantity < 5 ? 'border-red-500' : ''}`}
                              />
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

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Email Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Business Email</label>
                      <Input placeholder="fusionforgepc@gmail.com" disabled />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Service Status</label>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Simulation Mode (No API Key)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Inventory Alerts</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
                      <Input type="number" defaultValue="5" className="w-32" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <label className="text-sm text-gray-600">Send email alerts for low stock</label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminAuthGuard>
  );
}