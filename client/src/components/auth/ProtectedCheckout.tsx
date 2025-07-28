import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ShoppingCart, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCartStore } from "@/lib/cart-store";
import LoginSignupModal from "./LoginSignupModal";
import type { PcBuild } from "@shared/schema";

interface ProtectedCheckoutProps {
  build?: PcBuild;
  variant?: 'cart' | 'buy-now';
  className?: string;
  children?: React.ReactNode;
}

export default function ProtectedCheckout({ 
  build, 
  variant = 'cart',
  className = '',
  children 
}: ProtectedCheckoutProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { addToCart, closeCart } = useCartStore();

  const handleClick = () => {
    if (loading) return;

    // Close the cart sidebar before navigating
    closeCart();

    // Require authentication for checkout - redirect to login page
    if (!user) {
      setLocation('/login');
      return;
    }

    // User is authenticated, proceed to checkout
    if (variant === 'buy-now' && build) {
      // Add to cart and go directly to checkout
      addToCart(build, 1);
      setLocation('/checkout');
    } else {
      // Regular cart action or checkout navigation
      setLocation('/checkout');
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    // Close the cart sidebar before navigating
    closeCart();
    // After successful login, proceed with the original action
    if (variant === 'buy-now' && build) {
      addToCart(build, 1);
    }
    setLocation('/checkout');
  };

  if (children) {
    // Render custom children with click handler
    return (
      <>
        <div onClick={handleClick} className={className}>
          {children}
        </div>
        <LoginSignupModal 
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleLoginSuccess}
          redirectTo="/checkout"
        />
      </>
    );
  }

  // Default button rendering
  return (
    <>
      <Button 
        onClick={handleClick}
        disabled={loading}
        className={`fusion-gradient text-white hover:opacity-90 transition-all duration-200 ${className}`}
      >
        {variant === 'buy-now' ? (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Buy Now
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Checkout
          </>
        )}
      </Button>

      <LoginSignupModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
        redirectTo="/checkout"
      />
    </>
  );
}