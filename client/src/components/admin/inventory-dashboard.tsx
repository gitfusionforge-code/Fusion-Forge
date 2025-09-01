import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, AlertTriangle, TrendingUp, TrendingDown, 
  Plus, Minus, Edit, Eye, RefreshCw
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatPrice } from "@/lib/utils";

interface StockItem {
  id: number;
  name: string;
  stockQuantity: number;
  lowStockThreshold: number;
  price: number;
  isActive: boolean;
  type: 'build' | 'component';
}

interface StockMovement {
  id: number;
  movementType: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

interface StockAlert {
  id: number;
  alertType: 'low_stock' | 'out_of_stock';
  currentStock: number;
  threshold: number;
  itemName: string;
  createdAt: string;
}

export default function InventoryDashboard() {
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState<{quantity: number, reason: string, notes: string}>({
    quantity: 0,
    reason: '',
    notes: ''
  });
  const queryClient = useQueryClient();

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

  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: async ({itemId, itemType, newStock, movement}: {
      itemId: number, 
      itemType: 'build' | 'component', 
      newStock: number,
      movement: {quantity: number, reason: string, notes?: string}
    }) => {
      const response = await fetch(`/api/admin/inventory/${itemType}/${itemId}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: newStock, movement })
      });
      if (!response.ok) throw new Error('Failed to update stock');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stock-alerts'] });
      setSelectedItem(null);
      setStockAdjustment({quantity: 0, reason: '', notes: ''});
    }
  });

  // Resolve alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await fetch(`/api/admin/stock-alerts/${alertId}/resolve`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to resolve alert');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stock-alerts'] });
    }
  });

  const handleStockUpdate = () => {
    if (!selectedItem || stockAdjustment.quantity === 0 || !stockAdjustment.reason) return;
    
    const newStock = selectedItem.stockQuantity + stockAdjustment.quantity;
    if (newStock < 0) return;

    updateStockMutation.mutate({
      itemId: selectedItem.id,
      itemType: selectedItem.type,
      newStock,
      movement: {
        quantity: Math.abs(stockAdjustment.quantity),
        reason: stockAdjustment.reason,
        notes: stockAdjustment.notes
      }
    });
  };

  const getStockStatus = (item: StockItem) => {
    if (item.stockQuantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (item.stockQuantity <= item.lowStockThreshold) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  if (isLoading) {
    return <div className="p-6">Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <Button onClick={() => queryClient.invalidateQueries()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stock Alerts */}
      {alerts && alerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium text-red-800">Stock Alerts ({alerts.length})</p>
              {alerts.slice(0, 3).map((alert: StockAlert) => (
                <div key={alert.id} className="flex justify-between items-center">
                  <span className="text-red-700">{alert.itemName}: {alert.currentStock} units left</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => resolveAlertMutation.mutate(alert.id)}
                  >
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Inventory Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-lg font-semibold">
                  {inventory?.builds?.length + inventory?.components?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Low Stock Alerts</p>
                <p className="text-lg font-semibold">{alerts?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">PC Builds</p>
                <p className="text-lg font-semibold">{inventory?.builds?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Components</p>
                <p className="text-lg font-semibold">{inventory?.components?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Tables */}
      <Tabs defaultValue="builds" className="space-y-4">
        <TabsList>
          <TabsTrigger value="builds">PC Builds</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
        </TabsList>

        <TabsContent value="builds">
          <Card>
            <CardHeader>
              <CardTitle>PC Build Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventory?.builds?.map((build: any) => {
                  const status = getStockStatus({...build, type: 'build'});
                  return (
                    <div key={build.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{build.name}</h3>
                        <p className="text-sm text-gray-600">{formatPrice(build.price)}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className={status.color}>{status.label}</Badge>
                        <span className="text-sm font-medium">{build.stockQuantity} units</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedItem({...build, type: 'build'})}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components">
          <Card>
            <CardHeader>
              <CardTitle>Component Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventory?.components?.map((component: any) => {
                  const status = getStockStatus({...component, type: 'component'});
                  return (
                    <div key={component.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{component.name}</h3>
                        <p className="text-sm text-gray-600">{component.type} - {formatPrice(component.price)}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className={status.color}>{status.label}</Badge>
                        <span className="text-sm font-medium">{component.stockQuantity} units</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedItem({...component, type: 'component'})}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stock Adjustment Modal */}
      {selectedItem && (
        <Card className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Adjust Stock: {selectedItem.name}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Current Stock</label>
                <p className="text-lg font-semibold">{selectedItem.stockQuantity} units</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Adjustment (+/-)</label>
                <Input
                  type="number"
                  value={stockAdjustment.quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty, zero, or positive integers
                    if (value === '' || /^-?\d+$/.test(value)) {
                      const numValue = value === '' ? 0 : parseInt(value);
                      if (!isNaN(numValue)) {
                        setStockAdjustment(prev => ({
                          ...prev, 
                          quantity: numValue
                        }));
                      }
                    }
                  }}
                  placeholder="Enter adjustment amount"
                  data-testid="input-stock-adjustment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={stockAdjustment.reason}
                  onChange={(e) => setStockAdjustment(prev => ({...prev, reason: e.target.value}))}
                >
                  <option value="">Select reason</option>
                  <option value="purchase">New Purchase</option>
                  <option value="sale">Sale</option>
                  <option value="damage">Damage/Loss</option>
                  <option value="adjustment">Manual Adjustment</option>
                  <option value="return">Customer Return</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <Input
                  value={stockAdjustment.notes}
                  onChange={(e) => setStockAdjustment(prev => ({...prev, notes: e.target.value}))}
                  placeholder="Additional notes"
                />
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={handleStockUpdate}
                  disabled={stockAdjustment.quantity === 0 || !stockAdjustment.reason}
                  className="flex-1"
                >
                  Update Stock
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedItem(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}