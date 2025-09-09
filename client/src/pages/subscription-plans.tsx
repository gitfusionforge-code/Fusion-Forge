import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Crown, Building2, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  discountPercentage: number;
  description: string;
  minimumItems: number;
  features: string[];
}

interface CartItem {
  id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

export default function SubscriptionPlans() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Fetch subscription plans
  const { data: plans = [], isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription/plans'],
    enabled: !!user
  });

  // Fetch cart items from local storage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const cart = JSON.parse(savedCart);
        setCartItems(cart.items || []);
      } catch (error) {
        console.error('Error parsing cart data:', error);
      }
    }
  }, []);

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: { planId: string; items: CartItem[] }) => {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          userId: user?.uid
        })
      });
      if (!response.ok) throw new Error('Failed to create subscription');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Subscription Created! 🎉',
        description: 'Your subscription has been set up successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/user'] });
      setLocation('/subscriptions');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create subscription',
        variant: 'destructive',
      });
    }
  });

  const handleCreateSubscription = (planId: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to create a subscription.',
        variant: 'destructive',
      });
      setLocation('/login');
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: 'Empty Cart',
        description: 'Please add items to your cart before creating a subscription.',
        variant: 'destructive',
      });
      setLocation('/builds');
      return;
    }

    const plan = plans.find((p: SubscriptionPlan) => p.id === planId);
    if (plan && cartItems.length < plan.minimumItems) {
      toast({
        title: 'Minimum Items Required',
        description: `This plan requires at least ${plan.minimumItems} items in your cart.`,
        variant: 'destructive',
      });
      return;
    }

    setSelectedPlan(planId);
    createSubscriptionMutation.mutate({ planId, items: cartItems });
  };

  const getPlanIcon = (planId: string) => {
    if (planId.includes('premium')) return <Star className="h-6 w-6 text-yellow-500" />;
    if (planId.includes('business')) return <Building2 className="h-6 w-6 text-blue-500" />;
    if (planId.includes('enterprise')) return <Crown className="h-6 w-6 text-purple-500" />;
    return <ShoppingCart className="h-6 w-6 text-green-500" />;
  };

  const calculatePotentialSavings = (discountPercentage: number) => {
    const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return (cartTotal * discountPercentage) / 100;
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Subscription Plans</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Please log in to view our subscription plans and start saving on regular PC orders.
        </p>
        <Button asChild>
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }

  if (plansLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-8">Loading Subscription Plans...</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Subscription Plans</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Save money with regular PC deliveries. Choose a plan that fits your needs and enjoy 
          automatic discounts, priority support, and hassle-free recurring orders.
        </p>
        
        {cartItems.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-green-700 dark:text-green-400 font-medium">
              🛒 You have {cartItems.length} items in your cart (Total: ₹{cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString('en-IN')})
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Select a subscription plan below to start saving!
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {plans.map((plan: SubscriptionPlan) => {
          const isPopular = plan.id.includes('premium');
          const isEnterprise = plan.id.includes('enterprise');
          const potentialSavings = calculatePotentialSavings(plan.discountPercentage);
          const isEligible = cartItems.length >= plan.minimumItems;
          const isCreating = createSubscriptionMutation.isPending && selectedPlan === plan.id;

          return (
            <Card 
              key={plan.id} 
              className={`relative ${isPopular ? 'border-yellow-500 shadow-lg scale-105' : ''} ${isEnterprise ? 'border-purple-500' : ''}`}
              data-testid={`plan-card-${plan.id}`}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader>
                <div className="flex items-center gap-2">
                  {getPlanIcon(plan.id)}
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                </div>
                <CardDescription>{plan.description}</CardDescription>
                
                <div className="text-center pt-4">
                  <div className="text-3xl font-bold text-primary">
                    {plan.discountPercentage}% OFF
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {plan.billingCycle} delivery
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Minimum Items:</span>
                    <span className="font-medium">{plan.minimumItems}</span>
                  </div>
                  
                  {cartItems.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Your Savings:</span>
                      <span className="font-medium text-green-600">
                        ₹{potentialSavings.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleCreateSubscription(plan.id)}
                  disabled={!isEligible || createSubscriptionMutation.isPending}
                  data-testid={`button-select-plan-${plan.id}`}
                >
                  {isCreating ? (
                    'Creating Subscription...'
                  ) : !isEligible ? (
                    `Need ${plan.minimumItems - cartItems.length} More Items`
                  ) : (
                    'Start Subscription'
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {cartItems.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Items in Cart</h3>
          <p className="text-muted-foreground mb-6">
            Add PC builds to your cart to see subscription savings and start a plan.
          </p>
          <Button asChild>
            <Link href="/builds">Browse PC Builds</Link>
          </Button>
        </div>
      )}

      <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4 text-center">Why Choose Subscriptions?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-3">
              💰
            </div>
            <h3 className="font-semibold mb-2">Save Money</h3>
            <p className="text-sm text-muted-foreground">
              Get automatic discounts on every order, with savings increasing based on your plan.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-3">
              🚀
            </div>
            <h3 className="font-semibold mb-2">Priority Support</h3>
            <p className="text-sm text-muted-foreground">
              Get faster response times and dedicated support for all your subscription needs.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-3">
              ⚙️
            </div>
            <h3 className="font-semibold mb-2">Hassle-Free</h3>
            <p className="text-sm text-muted-foreground">
              Automatic billing and delivery scheduling. Pause or cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}