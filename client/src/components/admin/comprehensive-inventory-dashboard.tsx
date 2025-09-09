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
  const [isEditingBuild, setIsEditingBuild] = useState(false);
  const [selectedBuild, setSelectedBuild] = useState<any>(null);
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
  const [editBuildForm, setEditBuildForm] = useState<any>({
    name: '',
    description: '',
    basePrice: 0,
    budgetRange: '',
    category: '',
    processor: '',
    motherboard: '',
    ram: '',
    storage: '',
    gpu: '',
    casePsu: '',
    stockQuantity: 0,
    lowStockThreshold: 5,
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

  // Handle bulk import
  const handleBulkImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // In a real implementation, this would parse the CSV and update the database
    toast({
      title: "Import Started",
      description: `Processing ${file.name}. This feature will be fully implemented in the next update.`,
    });
  };

  // Handle bulk export
  const handleBulkExport = () => {
    const exportData = pcBuilds.map(build => ({
      id: build.id,
      name: build.name,
      basePrice: build.basePrice,
      stockQuantity: build.stockQuantity,
      budgetRange: build.budgetRange,
      category: build.category,
      isActive: build.isActive
    }));

    if (exportData.length === 0) {
      toast({
        title: "No Data",
        description: "No inventory data available to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(exportData[0]).join(',');
    const csvContent = [
      headers,
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_export_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "Inventory data exported successfully.",
    });
  };

  // Handle supplier editing
  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    // In a real implementation, this would open an edit dialog
    toast({
      title: "Edit Supplier",
      description: `Editing ${supplier.name}. This functionality will be fully implemented in the next update.`,
    });
  };

  // Handle supplier contact
  const handleContactSupplier = (supplier: Supplier) => {
    const subject = encodeURIComponent(`Business Inquiry - ${supplier.name}`);
    const body = encodeURIComponent(`Dear ${supplier.contactPerson},\n\nWe would like to discuss potential business opportunities.\n\nBest regards,\nFusionForge PCs Team`);
    const mailtoLink = `mailto:${supplier.email}?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
    
    toast({
      title: "Email Client Opened",
      description: `Opening email to contact ${supplier.contactPerson} at ${supplier.name}`,
    });
  };

  // Handle reports export
  const handleExportReports = () => {
    const reportData = [
      { category: 'Gaming PCs', turnoverRate: '12.5x/year', stockValue: '₹15,00,000' },
      { category: 'Office PCs', turnoverRate: '8.2x/year', stockValue: '₹8,50,000' },
      { category: 'Workstations', turnoverRate: '6.1x/year', stockValue: '₹12,00,000' }
    ];

    const headers = Object.keys(reportData[0]).join(',');
    const csvContent = [
      headers,
      ...reportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_reports_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "Inventory reports exported successfully.",
    });
  };

  // Handle reports import
  const handleImportReports = () => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast({
          title: "Import Started",
          description: `Processing ${file.name}. Import functionality will be fully implemented in the next update.`,
        });
      }
    };
    input.click();
  };

  // Handle dead stock analysis
  const handleViewDeadStock = () => {
    const deadStockData = [
      { item: 'Old Gaming PC Build', daysStagnant: 120, value: '₹45,000' },
      { item: 'Legacy Office PC', daysStagnant: 95, value: '₹30,000' },
      { item: 'Discontinued Workstation', daysStagnant: 150, value: '₹50,000' }
    ];

    // In a real implementation, this would open a detailed view
    toast({
      title: "Dead Stock Analysis",
      description: `Found ${deadStockData.length} items with no movement in 90+ days. Total value: ₹1,25,000`,
    });
  };

  // Handle editing PC build
  const handleEditBuild = (build: any) => {
    setSelectedBuild(build);
    setEditBuildForm({
      name: build.name || '',
      description: build.description || '',
      basePrice: build.basePrice || 0,
      budgetRange: build.budgetRange || '',
      category: build.category || '',
      processor: build.processor || '',
      motherboard: build.motherboard || '',
      ram: build.ram || '',
      storage: build.storage || '',
      gpu: build.gpu || '',
      casePsu: build.casePsu || '',
      stockQuantity: build.stockQuantity || 0,
      lowStockThreshold: build.lowStockThreshold || 5,
      isActive: build.isActive !== false
    });
    setIsEditingBuild(true);
  };

  // Handle saving edited build
  const handleSaveBuild = () => {
    // In a real implementation, this would send data to API
    toast({
      title: "PC Build Updated",
      description: `${editBuildForm.name} has been updated successfully. In a real implementation, this would update the database.`,
    });
    
    // Reset form and close dialog
    setIsEditingBuild(false);
    setSelectedBuild(null);
    setEditBuildForm({
      name: '',
      description: '',
      basePrice: 0,
      budgetRange: '',
      category: '',
      processor: '',
      motherboard: '',
      ram: '',
      storage: '',
      gpu: '',
      casePsu: '',
      stockQuantity: 0,
      lowStockThreshold: 5,
      isActive: true
    });
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setIsEditingBuild(false);
    setSelectedBuild(null);
  };

  // Handle adding new supplier
  const handleAddSupplier = () => {
    // In a real implementation, this would send data to an API
    const supplierId = `supplier_${Date.now()}`;
    const supplierData = {
      ...newSupplier,
      id: supplierId,
      isActive: true
    };

    // Mock API call - in real implementation, save to database
    toast({
      title: "Supplier Added",
      description: `${newSupplier.name} has been added successfully. In a real implementation, this would be saved to the database.`,
    });

    // Reset form and close dialog
    setNewSupplier({
      name: '',
      email: '',
      phone: '',
      contactPerson: '',
      leadTimeDays: 5,
      minimumOrderQuantity: 10,
      paymentTerms: '30 days',
      isActive: true
    });
    setIsAddingSupplier(false);
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
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleBulkImport}
                    className="hidden"
                    id="bulk-import-input"
                    data-testid="input-bulk-import"
                  />
                  <label htmlFor="bulk-import-input">
                    <Button variant="outline" className="flex items-center gap-2" asChild>
                      <span>
                        <Upload className="h-4 w-4" />
                        Import CSV
                      </span>
                    </Button>
                  </label>
                  <Button 
                    variant="outline" 
                    onClick={handleBulkExport}
                    className="flex items-center gap-2"
                    data-testid="button-bulk-export"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
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
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditBuild(build)}
                              data-testid={`button-edit-build-${build.id}`}
                            >
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
              <Button onClick={() => setIsAddingSupplier(true)} data-testid="button-add-supplier">
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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleEditSupplier(supplier)}
                          data-testid={`button-edit-supplier-${supplier.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleContactSupplier(supplier)}
                          data-testid={`button-contact-supplier-${supplier.id}`}
                        >
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
                <Button 
                  variant="outline"
                  onClick={handleExportReports}
                  data-testid="button-export-reports"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleImportReports}
                  data-testid="button-import-reports"
                >
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
                    <Button 
                      size="sm" 
                      className="mt-2"
                      onClick={handleViewDeadStock}
                      data-testid="button-view-dead-stock"
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit PC Build Dialog */}
      {isEditingBuild && selectedBuild && (
        <Dialog open={isEditingBuild} onOpenChange={setIsEditingBuild}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit PC Build - {selectedBuild.name}</DialogTitle>
              <DialogDescription>Update the PC build configuration and details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="build-name">Build Name</Label>
                  <Input
                    id="build-name"
                    value={editBuildForm.name}
                    onChange={(e) => setEditBuildForm((prev: any) => ({...prev, name: e.target.value}))}
                    placeholder="Enter build name"
                    data-testid="input-build-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="build-category">Category</Label>
                  <Select
                    value={editBuildForm.category}
                    onValueChange={(value) => setEditBuildForm((prev: any) => ({...prev, category: value}))}
                  >
                    <SelectTrigger data-testid="select-build-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gaming">Gaming</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="workstation">Workstation</SelectItem>
                      <SelectItem value="budget">Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="build-description">Description</Label>
                <Input
                  id="build-description"
                  value={editBuildForm.description}
                  onChange={(e) => setEditBuildForm((prev: any) => ({...prev, description: e.target.value}))}
                  placeholder="Enter build description"
                  data-testid="input-build-description"
                />
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="build-price">Base Price (₹)</Label>
                  <Input
                    id="build-price"
                    type="number"
                    value={editBuildForm.basePrice}
                    onChange={(e) => setEditBuildForm((prev: any) => ({...prev, basePrice: parseInt(e.target.value) || 0}))}
                    placeholder="Enter price"
                    data-testid="input-build-price"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="build-budget-range">Budget Range</Label>
                  <Input
                    id="build-budget-range"
                    value={editBuildForm.budgetRange}
                    onChange={(e) => setEditBuildForm((prev: any) => ({...prev, budgetRange: e.target.value}))}
                    placeholder="e.g., ₹20,000 - ₹30,000"
                    data-testid="input-budget-range"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock-quantity">Stock Quantity</Label>
                  <Input
                    id="stock-quantity"
                    type="number"
                    value={editBuildForm.stockQuantity}
                    onChange={(e) => setEditBuildForm((prev: any) => ({...prev, stockQuantity: parseInt(e.target.value) || 0}))}
                    placeholder="Enter stock quantity"
                    data-testid="input-stock-quantity"
                  />
                </div>
              </div>

              {/* Components */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Components</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="processor">Processor</Label>
                    <Input
                      id="processor"
                      value={editBuildForm.processor}
                      onChange={(e) => setEditBuildForm((prev: any) => ({...prev, processor: e.target.value}))}
                      placeholder="Enter processor details"
                      data-testid="input-processor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motherboard">Motherboard</Label>
                    <Input
                      id="motherboard"
                      value={editBuildForm.motherboard}
                      onChange={(e) => setEditBuildForm((prev: any) => ({...prev, motherboard: e.target.value}))}
                      placeholder="Enter motherboard details"
                      data-testid="input-motherboard"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ram">RAM</Label>
                    <Input
                      id="ram"
                      value={editBuildForm.ram}
                      onChange={(e) => setEditBuildForm((prev: any) => ({...prev, ram: e.target.value}))}
                      placeholder="Enter RAM specifications"
                      data-testid="input-ram"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storage">Storage</Label>
                    <Input
                      id="storage"
                      value={editBuildForm.storage}
                      onChange={(e) => setEditBuildForm((prev: any) => ({...prev, storage: e.target.value}))}
                      placeholder="Enter storage details"
                      data-testid="input-storage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gpu">Graphics Card (Optional)</Label>
                    <Input
                      id="gpu"
                      value={editBuildForm.gpu}
                      onChange={(e) => setEditBuildForm((prev: any) => ({...prev, gpu: e.target.value}))}
                      placeholder="Enter GPU details"
                      data-testid="input-gpu"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="case-psu">Case & PSU</Label>
                    <Input
                      id="case-psu"
                      value={editBuildForm.casePsu}
                      onChange={(e) => setEditBuildForm((prev: any) => ({...prev, casePsu: e.target.value}))}
                      placeholder="Enter case and PSU details"
                      data-testid="input-case-psu"
                    />
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="low-stock-threshold">Low Stock Threshold</Label>
                  <Input
                    id="low-stock-threshold"
                    type="number"
                    value={editBuildForm.lowStockThreshold}
                    onChange={(e) => setEditBuildForm((prev: any) => ({...prev, lowStockThreshold: parseInt(e.target.value) || 5}))}
                    placeholder="Enter threshold"
                    data-testid="input-low-stock-threshold"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="is-active"
                    checked={editBuildForm.isActive}
                    onChange={(e) => setEditBuildForm((prev: any) => ({...prev, isActive: e.target.checked}))}
                    data-testid="checkbox-is-active"
                  />
                  <Label htmlFor="is-active">Active (Available for purchase)</Label>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-6">
              <Button 
                onClick={handleSaveBuild}
                disabled={!editBuildForm.name || !editBuildForm.basePrice || !editBuildForm.category}
                className="flex-1"
                data-testid="button-save-build"
              >
                Save Changes
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancelEdit}
                className="flex-1"
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Supplier Dialog - moved outside of tabs to prevent interference */}
      {isAddingSupplier && (
        <Dialog open={isAddingSupplier} onOpenChange={setIsAddingSupplier}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>Enter supplier details below</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supplier-name">Company Name</Label>
                <Input
                  id="supplier-name"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier(prev => ({...prev, name: e.target.value}))}
                  placeholder="Enter company name"
                  data-testid="input-supplier-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-person">Contact Person</Label>
                <Input
                  id="contact-person"
                  value={newSupplier.contactPerson}
                  onChange={(e) => setNewSupplier(prev => ({...prev, contactPerson: e.target.value}))}
                  placeholder="Enter contact person name"
                  data-testid="input-contact-person"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-email">Email</Label>
                <Input
                  id="supplier-email"
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier(prev => ({...prev, email: e.target.value}))}
                  placeholder="Enter email address"
                  data-testid="input-supplier-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-phone">Phone (Optional)</Label>
                <Input
                  id="supplier-phone"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier(prev => ({...prev, phone: e.target.value}))}
                  placeholder="Enter phone number"
                  data-testid="input-supplier-phone"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lead-time">Lead Time (Days)</Label>
                  <Input
                    id="lead-time"
                    type="number"
                    value={newSupplier.leadTimeDays}
                    onChange={(e) => setNewSupplier(prev => ({...prev, leadTimeDays: parseInt(e.target.value)}))}
                    placeholder="5"
                    data-testid="input-lead-time"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min-order">Min Order Qty</Label>
                  <Input
                    id="min-order"
                    type="number"
                    value={newSupplier.minimumOrderQuantity}
                    onChange={(e) => setNewSupplier(prev => ({...prev, minimumOrderQuantity: parseInt(e.target.value)}))}
                    placeholder="10"
                    data-testid="input-min-order"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-terms">Payment Terms</Label>
                <Input
                  id="payment-terms"
                  value={newSupplier.paymentTerms}
                  onChange={(e) => setNewSupplier(prev => ({...prev, paymentTerms: e.target.value}))}
                  placeholder="30 days"
                  data-testid="input-payment-terms"
                />
              </div>
            </div>
            <div className="flex space-x-2 pt-4">
              <Button 
                onClick={handleAddSupplier}
                disabled={!newSupplier.name || !newSupplier.email || !newSupplier.contactPerson}
                className="flex-1"
                data-testid="button-save-supplier"
              >
                Add Supplier
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsAddingSupplier(false)}
                className="flex-1"
                data-testid="button-cancel-supplier"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}