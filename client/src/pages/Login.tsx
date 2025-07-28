import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LoginSignupModal from "@/components/auth/LoginSignupModal";

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(true);

  // If user is already logged in, redirect to checkout
  if (!loading && user) {
    setLocation('/checkout');
    return null;
  }

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    setLocation('/checkout');
  };

  const handleClose = () => {
    setShowLoginModal(false);
    setLocation('/builds');
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/builds")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Builds
          </Button>
        </div>

        <Card className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <ShoppingCart className="h-6 w-6 text-orange-500" />
              Login Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              You need to create an account or sign in to complete your purchase.
            </p>
            <p className="text-sm text-gray-500">
              Don't worry - your cart items are saved and will be waiting for you after login.
            </p>
            <Button 
              onClick={() => setShowLoginModal(true)}
              className="w-full fusion-gradient text-white"
            >
              Login / Sign Up
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/builds')}
              className="w-full"
            >
              Continue Shopping
            </Button>
          </CardContent>
        </Card>

        <LoginSignupModal 
          isOpen={showLoginModal}
          onClose={handleClose}
          onSuccess={handleLoginSuccess}
          redirectTo="/checkout"
        />
      </div>
    </div>
  );
}