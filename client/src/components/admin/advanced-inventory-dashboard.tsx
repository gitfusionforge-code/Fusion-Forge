import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, TrendingUp, Package, Upload, Download, Plus, Edit, Trash2, Mail, Phone, Building } from 'lucide-react';

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

export default function AdvancedInventoryDashboard() {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
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

  // Fetch suppliers data (mock for now)
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

  // Fetch forecasting data
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

  const addSupplierMutation = useMutation({
    mutationFn: async (supplierData: Partial<Supplier>) => {
      // This would call the backend API
      const response = await fetch('/api/admin/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData)
      });
      if (!response.ok) throw new Error('Failed to add supplier');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Supplier added successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsAddingSupplier(false);
      setNewSupplier({
        name: '', email: '', phone: '', contactPerson: '',
        leadTimeDays: 5, minimumOrderQuantity: 10, paymentTerms: '30 days', isActive: true
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add supplier',
        variant: 'destructive'
      });
    }
  });

  const handleBulkImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Handle CSV import
      toast({
        title: 'Import Started',
        description: `Processing ${file.name}...`
      });
    }
  };

  const handleBulkExport = () => {
    // Generate and download CSV
    toast({
      title: 'Export Started',
      description: 'Generating inventory report...'
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Inventory Management</h2>
          <p className="text-gray-600">Supplier management, forecasting, and bulk operations</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleBulkExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <input
            type="file"
            accept=".csv"
            onChange={handleBulkImport}
            className="hidden"
            id="bulk-import"
          />
          <Button variant="outline" size="sm" onClick={() => document.getElementById('bulk-import')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="forecasting" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="forecasting">Demand Forecasting</TabsTrigger>
          <TabsTrigger value="suppliers">Supplier Management</TabsTrigger>
          <TabsTrigger value="bulk-ops">Bulk Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="forecasting" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Items Below Reorder Point</p>
                    <p className="text-2xl font-bold text-red-600">
                      {forecastData.filter(item => item.currentStock <= item.reorderPoint).length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Predicted Stock-outs</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {forecastData.filter(item => item.daysUntilStockout <= 14).length}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Within 2 weeks</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg. Forecast Confidence</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round(forecastData.reduce((acc, item) => acc + item.confidence, 0) / forecastData.length)}%
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Forecast Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {forecastData.map((item) => (
                  <div key={`${item.itemType}-${item.itemId}`} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Package className="h-5 w-5 text-gray-500" />
                        <div>
                          <h4 className="font-semibold">{item.itemName}</h4>
                          <p className="text-sm text-gray-600 capitalize">{item.itemType}</p>
                        </div>
                      </div>
                      <Badge 
                        className={`${getUrgencyColor(item.urgency)} text-white`}
                      >
                        {item.urgency}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Current Stock</p>
                        <p className="font-semibold">{item.currentStock} units</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Predicted Demand</p>
                        <p className="font-semibold">{item.predictedDemand} units</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Days Until Stockout</p>
                        <p className="font-semibold">{item.daysUntilStockout} days</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Suggested Order</p>
                        <p className="font-semibold">{item.suggestedOrderQuantity} units</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-full rounded-full"
                        style={{ width: `${item.confidence}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Forecast Confidence: {item.confidence}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Supplier Directory</h3>
            <Button onClick={() => setIsAddingSupplier(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </div>

          {isAddingSupplier && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Supplier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier-name">Company Name</Label>
                    <Input 
                      id="supplier-name"
                      value={newSupplier.name}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-person">Contact Person</Label>
                    <Input 
                      id="contact-person"
                      value={newSupplier.contactPerson}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, contactPerson: e.target.value }))}
                      placeholder="Enter contact person name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier-email">Email</Label>
                    <Input 
                      id="supplier-email"
                      type="email"
                      value={newSupplier.email}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="supplier@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier-phone">Phone</Label>
                    <Input 
                      id="supplier-phone"
                      value={newSupplier.phone}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91-XXXXXXXXXX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lead-time">Lead Time (Days)</Label>
                    <Input 
                      id="lead-time"
                      type="number"
                      value={newSupplier.leadTimeDays}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, leadTimeDays: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="min-order">Minimum Order Quantity</Label>
                    <Input 
                      id="min-order"
                      type="number"
                      value={newSupplier.minimumOrderQuantity}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, minimumOrderQuantity: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="payment-terms">Payment Terms</Label>
                  <Input 
                    id="payment-terms"
                    value={newSupplier.paymentTerms}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    placeholder="e.g., 30 days"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => addSupplierMutation.mutate(newSupplier)}
                    disabled={addSupplierMutation.isPending}
                  >
                    {addSupplierMutation.isPending ? 'Adding...' : 'Add Supplier'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingSupplier(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Building className="h-5 w-5 text-gray-500" />
                      <div>
                        <h4 className="font-semibold">{supplier.name}</h4>
                        <p className="text-sm text-gray-600">{supplier.contactPerson}</p>
                      </div>
                    </div>
                    <Badge variant={supplier.isActive ? 'default' : 'secondary'}>
                      {supplier.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{supplier.email}</span>
                    </div>
                    {supplier.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-600">Lead Time</p>
                        <p className="font-medium">{supplier.leadTimeDays} days</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Min. Order</p>
                        <p className="font-medium">{supplier.minimumOrderQuantity} units</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-gray-600 text-xs">Payment Terms</p>
                      <p className="font-medium text-xs">{supplier.paymentTerms}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1 mt-3">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Mail className="h-3 w-3 mr-1" />
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bulk-ops" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Import</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Import inventory data from CSV files. Download our template for the correct format.
                </p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV Template
                  </Button>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleBulkImport}
                    className="hidden"
                    id="csv-import"
                  />
                  <Button 
                    className="w-full"
                    onClick={() => document.getElementById('csv-import')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose CSV File
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bulk Export</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Export current inventory data to CSV format for analysis or backup.
                </p>
                <div className="space-y-2">
                  <Button className="w-full" onClick={handleBulkExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export All Inventory
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Low Stock Items
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Forecast Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Import/Export History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { type: 'Import', file: 'inventory_update_20250109.csv', date: '2025-01-09 14:30', status: 'Completed', records: 245 },
                  { type: 'Export', file: 'full_inventory_20250108.csv', date: '2025-01-08 09:15', status: 'Completed', records: 1532 },
                  { type: 'Import', file: 'new_components_20250107.csv', date: '2025-01-07 16:45', status: 'Failed', records: 0 }
                ].map((operation, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {operation.type === 'Import' ? 
                        <Upload className="h-5 w-5 text-blue-500" /> : 
                        <Download className="h-5 w-5 text-green-500" />
                      }
                      <div>
                        <p className="font-medium">{operation.file}</p>
                        <p className="text-sm text-gray-600">{operation.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={operation.status === 'Completed' ? 'default' : 'destructive'}>
                        {operation.status}
                      </Badge>
                      {operation.status === 'Completed' && (
                        <p className="text-sm text-gray-600 mt-1">{operation.records} records</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}