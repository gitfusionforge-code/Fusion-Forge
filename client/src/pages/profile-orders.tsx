import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, CheckCircle, Clock, Truck, Eye, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import UserLayout from "@/components/user-layout";
import SEOHead from "@/components/enhanced-seo-head";
import type { Order } from "@shared/schema";

interface OrderItem {
  build?: {
    id: number;
    name: string;
    category: string;
    price: string;
  };
  name?: string;
  price?: string;
  quantity: number;
}

export default function ProfileOrders() {
  const { user } = useAuth();

  // Fetch user orders from API
  const { data: orders = [], isLoading, error } = useQuery<any[]>({
    queryKey: [`/api/user/${user?.uid}/orders`],
    enabled: !!user?.uid,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "processing":
        return <Clock className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <UserLayout>
      <SEOHead 
        title="Order History"
        description="View your order history and track current orders"
      />
      <div className="max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-deep-blue">Order History</h1>
          <p className="text-gray-600 mt-1">Track your orders and view purchase history</p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="text-center py-12">
              <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading orders...</h3>
              <p className="text-gray-600">Please wait while we fetch your order history</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading orders</h3>
              <p className="text-gray-600 mb-6">Unable to fetch your order history at this time</p>
              <Button onClick={() => window.location.reload()} className="bg-tech-orange hover:bg-orange-600">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-6">Start building your dream PC today</p>
              <Button className="bg-tech-orange hover:bg-orange-600">
                Browse PC Builds
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => {
              // Handle different data structures from Firebase
              let orderItems: OrderItem[] = [];
              let orderTotal = 0;
              let orderNumber = "";
              let orderDate = new Date();

              if (order.items) {
                // New format with items field
                orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                orderTotal = parseFloat(order.total || "0");
                orderNumber = order.orderNumber || `FF${order.id}`;
                orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
              } else {
                // Legacy format with individual build fields
                orderItems = [{
                  build: {
                    id: order.buildId || 0,
                    name: order.buildName || "Unknown Build",
                    category: "PC Build",
                    price: (order.totalAmount || 0).toString()
                  },
                  quantity: 1
                }];
                orderTotal = order.totalAmount || 0;
                orderNumber = `FF${order.id}`;
                orderDate = new Date();
              }

              return (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Order {orderNumber}</CardTitle>
                        <p className="text-sm text-gray-600">
                          Placed on {orderDate.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-deep-blue">
                          {formatPrice(orderTotal)}
                        </div>
                        <Badge 
                          className={`${getStatusColor(order.status)} flex items-center gap-1 mt-1`}
                        >
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{order.status}</span>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      {orderItems.map((item: OrderItem, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium">{item.build?.name || item.name}</h4>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                            {item.build?.category && (
                              <p className="text-xs text-gray-500 capitalize">{item.build.category}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">
                              {formatPrice(parseFloat(item.build?.price || item.price || "0"))}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center mt-6 pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        {order.status === "delivered" && "Delivered successfully"}
                        {order.status === "processing" && "Your order is being processed"}
                        {order.status === "shipped" && "Your order is on the way"}
                        {order.status === "paid" && "Payment confirmed, preparing for shipment"}
                        {order.status === "pending" && "Awaiting payment confirmation"}
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </UserLayout>
  );
}