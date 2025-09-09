import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  CreditCard, 
  Package, 
  Pause, 
  Play, 
  X, 
  MoreHorizontal,
  Truck,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Subscription {
  id: string;
  planName: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired' | 'pending';
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  finalPrice: number;
  discountPercentage: number;
  nextBillingDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  items: Array<{
    buildId: number;
    buildName: string;
    category: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalDelivered: number;
  successfulPayments: number;
  failedPayments: number;
  createdAt: string;
  cancellationReason?: string;
}

interface SubscriptionOrder {
  id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'failed';
  amount: number;
  billingPeriod: string;
  deliveryDate?: string;
  createdAt: string;
}

export default function Subscriptions() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);

  // Fetch user subscriptions
  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery<Subscription[]>({
    queryKey: ['/api/subscription/user', user?.uid],
    queryFn: () => {
      if (!user?.uid) throw new Error('User not authenticated');
      return fetch(`/api/subscription/user?userId=${user.uid}`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch subscriptions');
        return res.json();
      });
    },
    enabled: !!user?.uid
  });

  // Fetch subscription orders
  const { data: orders = [] } = useQuery<SubscriptionOrder[]>({
    queryKey: ['/api/subscription/orders', user?.uid],
    queryFn: () => {
      if (!user?.uid) throw new Error('User not authenticated');
      return fetch(`/api/subscription/orders?userId=${user.uid}`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch orders');
        return res.json();
      });
    },
    enabled: !!user?.uid
  });

  // Pause subscription mutation
  const pauseSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await fetch(`/api/subscription/${subscriptionId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid })
      });
      if (!response.ok) throw new Error('Failed to pause subscription');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Subscription Paused',
        description: 'Your subscription has been paused successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/user', user?.uid] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to pause subscription',
        variant: 'destructive',
      });
    }
  });

  // Resume subscription mutation
  const resumeSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await fetch(`/api/subscription/${subscriptionId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid })
      });
      if (!response.ok) throw new Error('Failed to resume subscription');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Subscription Resumed',
        description: 'Your subscription has been resumed successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/user', user?.uid] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resume subscription',
        variant: 'destructive',
      });
    }
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async ({ subscriptionId, reason }: { subscriptionId: string; reason?: string }) => {
      const response = await fetch(`/api/subscription/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid, reason })
      });
      if (!response.ok) throw new Error('Failed to cancel subscription');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription has been cancelled successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/user', user?.uid] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel subscription',
        variant: 'destructive',
      });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-red-500" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <MoreHorizontal className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    };

    return (
      <Badge className={cn('capitalize', variants[status as keyof typeof variants])}>
        {getStatusIcon(status)}
        <span className="ml-1">{status}</span>
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">My Subscriptions</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Please log in to view your subscriptions.
        </p>
        <Button asChild>
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }

  if (subscriptionsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Loading Subscriptions...</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Subscriptions</h1>
        
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Subscriptions Yet</h2>
          <p className="text-muted-foreground mb-6">
            Start saving with regular PC deliveries. Choose a subscription plan that fits your needs.
          </p>
          <Button asChild>
            <Link href="/subscription-plans">View Subscription Plans</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Subscriptions</h1>
        <Button asChild variant="outline">
          <Link href="/subscription-plans">Add New Subscription</Link>
        </Button>
      </div>

      <div className="grid gap-6">
        {subscriptions.map((subscription) => (
          <Card key={subscription.id} className="overflow-hidden" data-testid={`subscription-card-${subscription.id}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {subscription.planName}
                    {getStatusBadge(subscription.status)}
                  </CardTitle>
                  <CardDescription>
                    {subscription.billingCycle} billing • {subscription.discountPercentage}% discount
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{formatCurrency(subscription.finalPrice)}</div>
                  <div className="text-sm text-muted-foreground">per {subscription.billingCycle.replace('ly', '')}</div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Billing Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Next Billing</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(subscription.nextBillingDate)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Total Delivered</div>
                    <div className="text-sm text-muted-foreground">
                      {subscription.totalDelivered} orders
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Successful Payments</div>
                    <div className="text-sm text-muted-foreground">
                      {subscription.successfulPayments}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items in Subscription */}
              <div>
                <h4 className="font-medium mb-3">Items in Subscription</h4>
                <div className="space-y-2">
                  {subscription.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <div className="font-medium">{item.buildName}</div>
                        <div className="text-sm text-muted-foreground">{item.category}</div>
                      </div>
                      <div className="text-right">
                        <div>Qty: {item.quantity}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(item.unitPrice)} each
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                {subscription.status === 'active' && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => pauseSubscriptionMutation.mutate(subscription.id)}
                      disabled={pauseSubscriptionMutation.isPending}
                      data-testid={`button-pause-${subscription.id}`}
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          data-testid={`button-cancel-${subscription.id}`}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cancel Subscription</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to cancel this subscription? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline">Keep Subscription</Button>
                          <Button 
                            variant="destructive"
                            onClick={() => cancelSubscriptionMutation.mutate({ 
                              subscriptionId: subscription.id, 
                              reason: 'User requested cancellation' 
                            })}
                            disabled={cancelSubscriptionMutation.isPending}
                          >
                            Yes, Cancel Subscription
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
                
                {subscription.status === 'paused' && (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => resumeSubscriptionMutation.mutate(subscription.id)}
                    disabled={resumeSubscriptionMutation.isPending}
                    data-testid={`button-resume-${subscription.id}`}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Resume
                  </Button>
                )}
                
                {subscription.status === 'cancelled' && subscription.cancellationReason && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Cancelled: {subscription.cancellationReason}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders Section */}
      {orders.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Recent Subscription Orders</h2>
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{order.orderNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.billingPeriod} • {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(order.amount)}</div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}