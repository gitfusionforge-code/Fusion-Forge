import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCartStore } from '@/lib/cart-store';
import { ShoppingCart, Plus, Minus, Check } from 'lucide-react';
import type { PcBuild } from '@shared/schema';

interface AddToCartButtonProps {
  build: PcBuild;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  showQuantity?: boolean;
  className?: string;
}

export default function AddToCartButton({ 
  build, 
  variant = 'default', 
  size = 'default',
  showQuantity = false,
  className = '' 
}: AddToCartButtonProps) {
  const { toast } = useToast();
  const { items, addToCart, updateQuantity, removeFromCart } = useCartStore();
  const [isAdding, setIsAdding] = useState(false);
  
  const cartItem = items.find(item => item.build.id === build.id);
  const quantity = cartItem?.quantity || 0;
  const isInCart = quantity > 0;

  const handleAddToCart = async () => {
    setIsAdding(true);
    
    try {
      addToCart(build, 1);
      
      toast({
        title: "Added to Cart!",
        description: `${build.name} has been added to your cart.`,
        duration: 2000,
      });
      
      // Brief success animation
      setTimeout(() => setIsAdding(false), 500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
      setIsAdding(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(build.id);
      toast({
        title: "Removed from Cart",
        description: `${build.name} has been removed from your cart.`,
      });
    } else {
      updateQuantity(build.id, newQuantity);
    }
  };

  if (isInCart && showQuantity) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuantityChange(quantity - 1)}
          className="h-8 w-8 p-0"
        >
          <Minus className="h-3 w-3" />
        </Button>
        
        <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
          {quantity} in cart
        </Badge>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuantityChange(quantity + 1)}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant={isInCart ? 'secondary' : variant}
      size={size}
      onClick={handleAddToCart}
      disabled={isAdding}
      className={`
        ${className} 
        ${isInCart 
          ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200 hover:border-green-300' 
          : 'bg-gradient-to-r from-tech-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg'
        } 
        whitespace-nowrap flex items-center justify-center 
        transition-all duration-300 ease-in-out 
        transform hover:scale-105 active:scale-95
        group relative overflow-hidden
        min-h-[48px] leading-tight
        ${isAdding ? 'animate-pulse' : ''}
      `}
    >
      {/* Ripple effect overlay */}
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-md"></div>
      
      {isAdding ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          <span className="animate-pulse">Adding...</span>
        </>
      ) : isInCart ? (
        <>
          <Check className="mr-2 h-4 w-4 animate-bounce" />
          <span>In Cart</span>
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-4 w-4 group-hover:animate-bounce transition-transform" />
          <span>Add to Cart</span>
        </>
      )}
    </Button>
  );
}