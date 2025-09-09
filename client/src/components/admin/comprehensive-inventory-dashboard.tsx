import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, TrendingUp, Package, Upload, Download, Plus, Edit, Trash2, 
  RefreshCw, Eye, Building, Mail, Phone, Calendar, BarChart3, DollarSign
} from 'lucide-react';
import AddPcBuildForm from './add-pc-build-form';

interface StockItem {
  id: number;
  name: string;
  stockQuantity: number;
  lowStockThreshold: number;
  price: number;
  isActive: boolean;
  type: 'build' | 'component';
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  contactPerson: string;
  leadTimeDays: number;
  minimumOrderQuantity: number;
  paymentTerms: string;
  isActive: boolean;
}

interface ForecastResult {
  itemId: number;
  itemType: 'build' | 'component';
  itemName: string;
  currentStock: number;
  predictedDemand: number;
  reorderPoint: number;
  suggestedOrderQuantity: number;
  daysUntilStockout: number;
  confidence: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export default function ComprehensiveInventoryDashboard() {
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState<{quantity: number, reason: string, notes: string}>({
    quantity: 0,
    reason: '',
    notes: ''
  });
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    name: '',
    email: '',
    phone: '',
    contactPerson: '',
    leadTimeDays: 5,
    minimumOrderQuantity: 10,
    paymentTerms: '30 days',
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle purchase order creation
  const handleCreatePurchaseOrder = (item: ForecastResult) => {
    // Create purchase order data
    const poData = {
      itemId: item.itemId,
      itemName: item.itemName,
      itemType: item.itemType,
      quantity: item.suggestedOrderQuantity,
      urgency: item.urgency,
      estimatedCost: item.suggestedOrderQuantity * 1000, // Mock pricing
      daysUntilStockout: item.daysUntilStockout
    };

    // In a real implementation, this would send data to an API
    // For now, we'll show a success toast and prepare download
    const poDocument = `PURCHASE ORDER\n\nItem: ${poData.itemName}\nQuantity: ${poData.quantity} units\nUrgency: ${poData.urgency}\nEstimated Cost: ₹${poData.estimatedCost.toLocaleString('en-IN')}\nDays Until Stockout: ${poData.daysUntilStockout}\n\nGenerated on: ${new Date().toLocaleString('en-IN')}`;
    
    // Create and download PO file
    const blob = new Blob([poDocument], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PO_${item.itemName.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Purchase Order Created",
      description: `PO created for ${item.itemName} (${item.suggestedOrderQuantity} units)`,
    });
  };

  // Fetch inventory data
  const { data: inventory, isLoading } = useQuery({
    queryKey: ['/api/admin/inventory'],
    queryFn: async () => {
      const response = await fetch('/api/admin/inventory');
      if (!response.ok) throw new Error('Failed to fetch inventory');
      return response.json();
    }
  });

  // Fetch low stock alerts
  const { data: alerts } = useQuery({
    queryKey: ['/api/admin/stock-alerts'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stock-alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json();
    }
  });

  // Fetch PC builds
  const { data: pcBuilds = [] } = useQuery<any[]>({
    queryKey: ["/api/builds"],
  });

  // Mock suppliers data (replace with real API call)
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      return [
        {
          id: 'supplier_001',
          name: 'TechSource Components',
          email: 'orders@techsource.com',
          phone: '+91-9876543210',
          contactPerson: 'Rajesh Kumar',
          leadTimeDays: 5,
          minimumOrderQuantity: 10,
          paymentTerms: '30 days',
          isActive: true
        },
        {
          id: 'supplier_002', 
          name: 'Digital Hardware Solutions',
          email: 'procurement@digitalhw.com',
          phone: '+91-9876543211',
          contactPerson: 'Priya Sharma',
          leadTimeDays: 7,
          minimumOrderQuantity: 5,
          paymentTerms: '45 days',
          isActive: true
        }
      ] as Supplier[];
    }
  });

  // Mock forecasting data (replace with real API call)
  const { data: forecastData = [] } = useQuery({
    queryKey: ['inventory-forecast'],
    queryFn: async () => {
      return [
        {
          itemId: 1,
          itemType: 'build',
          itemName: 'Gaming Beast Pro',
          currentStock: 8,
          predictedDemand: 25,
          reorderPoint: 10,
          suggestedOrderQuantity: 30,
          daysUntilStockout: 12,
          confidence: 85,
          urgency: 'high'
        },
        {
          itemId: 2,
          itemType: 'component',
          itemName: 'RTX 4070 Graphics Card',
          currentStock: 3,
          predictedDemand: 15,
          reorderPoint: 5,
          suggestedOrderQuantity: 20,
          daysUntilStockout: 6,
          confidence: 92,
          urgency: 'critical'
        },
        {
          itemId: 3,
          itemType: 'build',
          itemName: 'Office Essential',
          currentStock: 15,
          predictedDemand: 8,
          reorderPoint: 12,
          suggestedOrderQuantity: 15,
          daysUntilStockout: 45,
          confidence: 78,
          urgency: 'low'
        }
      ] as ForecastResult[];
    }
  });

  // Calculate inventory metrics
  const inventoryMetrics = {
    totalItems: pcBuilds.length,
    lowStockItems: pcBuilds.filter((build: any) => build.stockQuantity < 5).length,
    averagePrice: pcBuilds.length > 0 ? Math.round(pcBuilds.reduce((sum: number, build: any) => sum + build.basePrice, 0) / pcBuilds.length) : 0,
    totalValue: pcBuilds.reduce((sum: number, build: any) => sum + (build.basePrice * build.stockQuantity), 0),
    outOfStock: pcBuilds.filter((build: any) => build.stockQuantity === 0).length,
    criticalStock: forecastData.filter(item => item.urgency === 'critical').length
  };

  const getStockStatus = (stockQuantity: number, threshold: number = 5) => {
    if (stockQuantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (stockQuantity <= threshold) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stock Alerts */}
      {alerts && alerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium text-red-800">Stock Alerts ({alerts.length})</p>
              {alerts.slice(0, 3).map((alert: any) => (
                <div key={alert.id} className="flex justify-between items-center">
                  <span className="text-red-700">{alert.itemName}: {alert.currentStock} units left</span>
                  <Button size="sm" variant="outline">Resolve</Button>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Inventory Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-blue-600">{inventoryMetrics.totalItems}</p>
              </div>
              <Package className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{inventoryMetrics.lowStockItems}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{inventoryMetrics.outOfStock}</p>
              </div>
              <Package className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Price</p>
                <p className="text-2xl font-bold text-green-600">₹{inventoryMetrics.averagePrice.toLocaleString('en-IN')}</p>
              </div>
              <BarChart3 className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-purple-600">₹{inventoryMetrics.totalValue.toLocaleString('en-IN')}</p>
              </div>
              <DollarSign className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Items</p>
                <p className="text-2xl font-bold text-red-600">{inventoryMetrics.criticalStock}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Inventory Management Tabs */}
      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stock">Stock Management</TabsTrigger>
          <TabsTrigger value="forecasting">Demand Forecasting</TabsTrigger>
          <TabsTrigger value="suppliers">Supplier Management</TabsTrigger>
          <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
        </TabsList>

        {/* Stock Management Tab */}
        <TabsContent value="stock">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">PC Build Inventory</h2>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add New Build
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New PC Build</DialogTitle>
                      <DialogDescription>Create a new PC build configuration</DialogDescription>
                    </DialogHeader>
                    <AddPcBuildForm />
                  </DialogContent>
                </Dialog>
                <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {pcBuilds.map((build: any) => {
                    const status = getStockStatus(build.stockQuantity, build.lowStockThreshold || 5);
                    return (
                      <div key={build.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium">{build.name}</h3>
                            <Badge variant="outline" className="capitalize">{build.category}</Badge>
                            <Badge className={status.color}>{status.label}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{build.description}</p>
                          <p className="text-sm font-medium text-gray-900 mt-1">₹{build.basePrice.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Stock Quantity</p>
                            <p className={`text-lg font-semibold ${build.stockQuantity < 5 ? 'text-red-600' : 'text-gray-900'}`}>
                              {build.stockQuantity}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Build Details - {build.name}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Processor</Label>
                                      <p className="text-sm">{build.processor}</p>
                                    </div>
                                    <div>
                                      <Label>Motherboard</Label>
                                      <p className="text-sm">{build.motherboard}</p>
                                    </div>
                                    <div>
                                      <Label>RAM</Label>
                                      <p className="text-sm">{build.ram}</p>
                                    </div>
                                    <div>
                                      <Label>Storage</Label>
                                      <p className="text-sm">{build.storage}</p>
                                    </div>
                                    {build.gpu && (
                                      <div>
                                        <Label>Graphics Card</Label>
                                        <p className="text-sm">{build.gpu}</p>
                                      </div>
                                    )}
                                    <div>
                                      <Label>Case & PSU</Label>
                                      <p className="text-sm">{build.casePsu}</p>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Demand Forecasting Tab */}
        <TabsContent value="forecasting">
          <Card>
            <CardHeader>
              <CardTitle>Demand Forecasting & Reorder Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {forecastData.map((item: ForecastResult) => (
                  <div key={`${item.itemType}-${item.itemId}`} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{item.itemName}</h3>
                          <Badge className={getUrgencyColor(item.urgency)}>{item.urgency}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Current Stock</p>
                            <p className="font-medium">{item.currentStock} units</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Predicted Demand</p>
                            <p className="font-medium">{item.predictedDemand} units</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Days Until Stockout</p>
                            <p className="font-medium">{item.daysUntilStockout} days</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Confidence</p>
                            <p className="font-medium">{item.confidence}%</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Suggested Order</p>
                        <p className="text-lg font-semibold">{item.suggestedOrderQuantity} units</p>
                        <Button 
                          size="sm" 
                          className="mt-2"
                          onClick={() => handleCreatePurchaseOrder(item)}
                          data-testid={`button-create-po-${item.itemId}`}
                        >
                          Create PO
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supplier Management Tab */}
        <TabsContent value="suppliers">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Supplier Management</h2>
              <Button onClick={() => setIsAddingSupplier(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((supplier: Supplier) => (
                <Card key={supplier.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{supplier.name}</h3>
                        <Badge variant={supplier.isActive ? "default" : "secondary"}>
                          {supplier.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span>{supplier.contactPerson}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{supplier.email}</span>
                        </div>
                        {supplier.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{supplier.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{supplier.leadTimeDays} days lead time</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-gray-600">Min Order</p>
                            <p className="font-medium">{supplier.minimumOrderQuantity}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Payment Terms</p>
                            <p className="font-medium">{supplier.paymentTerms}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Mail className="h-4 w-4 mr-1" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Reports & Analytics Tab */}
        <TabsContent value="reports">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Inventory Reports & Analytics</h2>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Stock Turnover</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Track how quickly inventory moves</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Gaming PCs</span>
                      <span className="font-medium">12.5x/year</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Office PCs</span>
                      <span className="font-medium">8.2x/year</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Workstations</span>
                      <span className="font-medium">6.1x/year</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dead Stock Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Items with no movement in 90+ days</p>
                  <div className="mt-4">
                    <p className="text-2xl font-bold text-orange-600">3 items</p>
                    <p className="text-sm text-gray-600">Worth ₹1,25,000</p>
                    <Button size="sm" className="mt-2">View Details</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}