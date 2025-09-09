import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Tag, Percent, Gift, TrendingUp, Users, Calendar, Plus, Edit, Trash2, Copy, Eye, BarChart3, DollarSign } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface DiscountCode {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_x_get_y';
  value: number;
  minimumOrderValue?: number;
  maximumDiscount?: number;
  applicableCategories: string[];
  usageLimit?: number;
  usageCount: number;
  usagePerCustomer?: number;
  validFrom: number;
  validUntil: number;
  isActive: boolean;
  stackable: boolean;
  createdAt: number;
}

interface BulkPricingTier {
  id: string;
  name: string;
  minimumQuantity: number;
  discountPercentage: number;
  applicableCategories: string[];
  isActive: boolean;
}

interface DiscountAnalytics {
  totalCodes: number;
  activeCodes: number;
  totalUsage: number;
  totalSavings: number;
  popularCodes: Array<{ code: string; usage: number; savings: number }>;
  conversionRate: number;
}

export default function DiscountManagementDashboard() {
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountCode | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newDiscount, setNewDiscount] = useState<Partial<DiscountCode>>({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    minimumOrderValue: 0,
    maximumDiscount: 0,
    applicableCategories: [],
    usageLimit: undefined,
    usagePerCustomer: 1,
    validFrom: Date.now(),
    validUntil: Date.now() + 30 * 24 * 60 * 60 * 1000,
    isActive: true,
    stackable: false
  });
  const [filterType, setFilterType] = useState('all');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch discount codes
  const { data: discountCodes = [] } = useQuery({
    queryKey: ['discount-codes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/discount-codes');
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Fetch bulk pricing tiers
  const { data: bulkTiers = [] } = useQuery({
    queryKey: ['bulk-pricing-tiers'],
    queryFn: async () => {
      return [
        {
          id: 'bulk_001',
          name: 'Small Business (5-10 units)',
          minimumQuantity: 5,
          discountPercentage: 5,
          applicableCategories: ['Office Essentials', 'Budget Builders'],
          isActive: true
        },
        {
          id: 'bulk_002',
          name: 'Enterprise (20+ units)',
          minimumQuantity: 20,
          discountPercentage: 15,
          applicableCategories: [],
          isActive: true
        }
      ] as BulkPricingTier[];
    }
  });

  // Fetch analytics
  const { data: analytics } = useQuery({
    queryKey: ['discount-analytics'],
    queryFn: async () => {
      return {
        totalCodes: 12,
        activeCodes: 8,
        totalUsage: 461,
        totalSavings: 2845000,
        popularCodes: [
          { code: 'WELCOME10', usage: 245, savings: 875000 },
          { code: 'GAMING20', usage: 127, savings: 1234000 },
          { code: 'FREESHIP', usage: 89, savings: 156000 }
        ],
        conversionRate: 18.5
      } as DiscountAnalytics;
    }
  });

  const createDiscountMutation = useMutation({
    mutationFn: async (discountData: Partial<DiscountCode>) => {
      const response = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discountData)
      });
      if (!response.ok) throw new Error('Failed to create discount');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Discount code created successfully' });
      queryClient.invalidateQueries({ queryKey: ['discount-codes'] });
      setIsCreating(false);
      setNewDiscount({
        code: '', name: '', description: '', type: 'percentage', value: 0,
        minimumOrderValue: 0, maximumDiscount: 0, applicableCategories: [],
        usageLimit: undefined, usagePerCustomer: 1, validFrom: Date.now(),
        validUntil: Date.now() + 30 * 24 * 60 * 60 * 1000, isActive: true, stackable: false
      });
    }
  });

  const toggleDiscountMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/admin/discounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      if (!response.ok) throw new Error('Failed to update discount');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-codes'] });
    }
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <Percent className="h-4 w-4" />;
      case 'fixed_amount': return <DollarSign className="h-4 w-4" />;
      case 'free_shipping': return <Gift className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'percentage': return 'bg-blue-500';
      case 'fixed_amount': return 'bg-green-500';
      case 'free_shipping': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredDiscounts = discountCodes.filter(discount => {
    if (filterType === 'all') return true;
    return discount.type === filterType;
  });

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewDiscount(prev => ({ ...prev, code: result }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Discount Management</h2>
          <p className="text-gray-600">Create and manage discount codes and bulk pricing</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Discount
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Codes</p>
                <p className="text-2xl font-bold">{analytics?.totalCodes}</p>
              </div>
              <Tag className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-green-600 mt-1">{analytics?.activeCodes} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Usage</p>
                <p className="text-2xl font-bold">{analytics?.totalUsage}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-green-600 mt-1">{analytics?.conversionRate}% conversion</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Savings</p>
                <p className="text-2xl font-bold">₹{analytics?.totalSavings ? Math.round(analytics.totalSavings/1000) : 0}K</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Discount</p>
                <p className="text-2xl font-bold">12.8%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="codes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="codes">Discount Codes</TabsTrigger>
          <TabsTrigger value="bulk-pricing">Bulk Pricing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="codes" className="space-y-4">
          {isCreating && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Discount Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="discount-code">Discount Code</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="discount-code"
                        value={newDiscount.code}
                        onChange={(e) => setNewDiscount(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                        placeholder="DISCOUNT20"
                      />
                      <Button variant="outline" onClick={generateRandomCode}>
                        Generate
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="discount-name">Display Name</Label>
                    <Input
                      id="discount-name"
                      value={newDiscount.name}
                      onChange={(e) => setNewDiscount(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Holiday Special"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="discount-description">Description</Label>
                    <Textarea
                      id="discount-description"
                      value={newDiscount.description}
                      onChange={(e) => setNewDiscount(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Special discount for holiday season"
                    />
                  </div>

                  <div>
                    <Label htmlFor="discount-type">Discount Type</Label>
                    <Select 
                      value={newDiscount.type} 
                      onValueChange={(value) => setNewDiscount(prev => ({ ...prev, type: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                        <SelectItem value="free_shipping">Free Shipping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="discount-value">
                      {newDiscount.type === 'percentage' ? 'Percentage (%)' : 
                       newDiscount.type === 'fixed_amount' ? 'Amount (₹)' : 'Value'}
                    </Label>
                    <Input
                      id="discount-value"
                      type="number"
                      value={newDiscount.value}
                      onChange={(e) => setNewDiscount(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
                      disabled={newDiscount.type === 'free_shipping'}
                    />
                  </div>

                  <div>
                    <Label htmlFor="min-order">Minimum Order Value (₹)</Label>
                    <Input
                      id="min-order"
                      type="number"
                      value={newDiscount.minimumOrderValue}
                      onChange={(e) => setNewDiscount(prev => ({ ...prev, minimumOrderValue: parseFloat(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="usage-limit">Usage Limit (Optional)</Label>
                    <Input
                      id="usage-limit"
                      type="number"
                      value={newDiscount.usageLimit || ''}
                      onChange={(e) => setNewDiscount(prev => ({ 
                        ...prev, 
                        usageLimit: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                      placeholder="Unlimited"
                    />
                  </div>

                  <div>
                    <Label htmlFor="valid-from">Valid From</Label>
                    <Input
                      id="valid-from"
                      type="date"
                      value={format(new Date(newDiscount.validFrom!), 'yyyy-MM-dd')}
                      onChange={(e) => setNewDiscount(prev => ({ 
                        ...prev, 
                        validFrom: new Date(e.target.value).getTime() 
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="valid-until">Valid Until</Label>
                    <Input
                      id="valid-until"
                      type="date"
                      value={format(new Date(newDiscount.validUntil!), 'yyyy-MM-dd')}
                      onChange={(e) => setNewDiscount(prev => ({ 
                        ...prev, 
                        validUntil: new Date(e.target.value).getTime() 
                      }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newDiscount.isActive}
                      onCheckedChange={(checked) => setNewDiscount(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label>Active</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newDiscount.stackable}
                      onCheckedChange={(checked) => setNewDiscount(prev => ({ ...prev, stackable: checked }))}
                    />
                    <Label>Stackable</Label>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    onClick={() => createDiscountMutation.mutate(newDiscount)}
                    disabled={!newDiscount.code || !newDiscount.name || createDiscountMutation.isPending}
                  >
                    {createDiscountMutation.isPending ? 'Creating...' : 'Create Discount'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center space-x-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                <SelectItem value="free_shipping">Free Shipping</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDiscounts.map((discount) => (
              <Card key={discount.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getTypeColor(discount.type)} text-white`}>
                        {getTypeIcon(discount.type)}
                        <span className="ml-1 capitalize">{discount.type.replace('_', ' ')}</span>
                      </Badge>
                      <Badge variant={discount.isActive ? 'default' : 'secondary'}>
                        {discount.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <Switch
                      checked={discount.isActive}
                      onCheckedChange={(checked) => toggleDiscountMutation.mutate({ 
                        id: discount.id, 
                        isActive: checked 
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-lg">{discount.code}</h4>
                      <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(discount.code)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <h5 className="font-medium">{discount.name}</h5>
                    <p className="text-sm text-gray-600">{discount.description}</p>
                  </div>

                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Value:</span>
                      <span className="font-medium">
                        {discount.type === 'percentage' ? `${discount.value}%` :
                         discount.type === 'fixed_amount' ? `₹${discount.value}` : 'Free Shipping'}
                      </span>
                    </div>
                    
                    {discount.minimumOrderValue && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Min Order:</span>
                        <span className="font-medium">₹{discount.minimumOrderValue}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-gray-600">Usage:</span>
                      <span className="font-medium">
                        {discount.usageCount}
                        {discount.usageLimit ? `/${discount.usageLimit}` : ''}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Valid Until:</span>
                      <span className="font-medium">
                        {format(new Date(discount.validUntil), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>

                  {discount.usageLimit && (
                    <div className="mt-3">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min((discount.usageCount / discount.usageLimit) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {Math.round((discount.usageCount / discount.usageLimit) * 100)}% used
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-1 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bulk-pricing" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Bulk Pricing Tiers</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Tier
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bulkTiers.map((tier) => (
              <Card key={tier.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{tier.name}</h4>
                      <Badge variant={tier.isActive ? 'default' : 'secondary'}>
                        {tier.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <Switch checked={tier.isActive} />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Minimum Quantity:</span>
                      <span className="font-medium">{tier.minimumQuantity} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-medium text-green-600">{tier.discountPercentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Categories:</span>
                      <span className="font-medium">
                        {tier.applicableCategories.length > 0 ? 
                          `${tier.applicableCategories.length} categories` : 
                          'All categories'
                        }
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-1 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Popular Discount Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.popularCodes.map((code, index) => (
                    <div key={code.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{code.code}</p>
                          <p className="text-sm text-gray-600">{code.usage} uses</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{Math.round(code.savings/1000)}K</p>
                        <p className="text-sm text-gray-600">saved</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Discount Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">18.5%</p>
                    <p className="text-sm text-gray-600">Conversion Rate</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">₹6.2K</p>
                    <p className="text-sm text-gray-600">Avg Order Value</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">2.3x</p>
                    <p className="text-sm text-gray-600">Repeat Usage</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">87%</p>
                    <p className="text-sm text-gray-600">Customer Satisfaction</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Usage Trends</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Weekend Usage</span>
                      <span className="font-medium">+23%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Holiday Periods</span>
                      <span className="font-medium">+45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Customer Usage</span>
                      <span className="font-medium">67%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}