import { X, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/lib/cart-store';
import { Link } from 'wouter';
import ProtectedCheckout from '@/components/auth/ProtectedCheckout';
import { formatPrice } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export default function CartSidebar() {
  const { 
    items, 
    isOpen, 
    closeCart, 
    updateQuantity, 
    removeFromCart, 
    getTotalItems, 
    getTotalPrice,
    getTotalWithGST,
    getGSTAmount,
    clearCart 
  } = useCartStore();
  const isMobile = useIsMobile();

  const subtotal = getTotalPrice();
  const gstAmount = getGSTAmount();
  const totalWithGST = getTotalWithGST();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={closeCart}
      />
      
      {/* Cart Sidebar */}
      <div className={`fixed ${isMobile ? 'inset-0' : 'right-0 top-0'} h-full ${isMobile ? 'w-full' : 'w-96'} bg-white shadow-xl z-50 flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Shopping Cart</h2>
            {getTotalItems() > 0 && (
              <Badge variant="secondary">{getTotalItems()}</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={closeCart}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <Button onClick={closeCart} asChild>
                <Link to="/builds">Browse PC Builds</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.build.id} className="border rounded-lg p-4">
                  <div className="flex gap-3">
                    <img
                      src={item.build.imageUrl ?? '/api/placeholder/400/300'}
                      alt={item.build.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{item.build.name}</h3>
                      <p className="text-xs text-gray-500 mb-2">{item.build.category}</p>
                      <p className="font-semibold text-sm">
                        {formatPrice(item.build.basePrice.toString())}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.build.id, item.quantity - 1)}
                        className="h-7 w-7 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="text-sm font-medium px-2">
                        {item.quantity}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.build.id, item.quantity + 1)}
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.build.id)}
                      className="text-red-500 hover:text-red-700 h-7 w-7 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {items.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  className="w-full text-red-500 hover:text-red-700"
                >
                  Clear Cart
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span>Subtotal:</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>GST (18%):</span>
              <span>₹{gstAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-lg">
                ₹{totalWithGST.toLocaleString('en-IN')}
              </span>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="text-xs text-gray-600 text-center mb-2">
                Click checkout to login and complete purchase
              </div>
              <ProtectedCheckout 
                variant="cart"
                className="w-full bg-tech-orange hover:bg-orange-600"
              />
              <Button 
                variant="outline" 
                className="w-full"
                onClick={closeCart}
                asChild
              >
                <Link to="/builds">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}