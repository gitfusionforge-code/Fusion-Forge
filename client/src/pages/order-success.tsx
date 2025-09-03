import { useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Home, Package, Phone } from 'lucide-react';
import SEOHead from '@/components/enhanced-seo-head';
import fusionForgeLogo from "@assets/generated_images/Optimized_Fusion_Forge_logo_7b2e6c20.png";

export default function OrderSuccess() {
  useEffect(() => {
    // Track successful order
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        event_category: 'ecommerce',
        event_label: 'order_completed'
      });
    }
  }, []);

  return (
    <>
      <SEOHead 
        title="Order Confirmed - FusionForge PCs"
        description="Your PC build order has been successfully placed. We'll contact you within 24 hours."
      />
      
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="text-center">
            <CardContent className="py-12">
              <div className="flex justify-center mb-6">
                <img 
                  src={fusionForgeLogo}
                  alt="FusionForge PCs Logo"
                  className="w-32 h-32 object-contain drop-shadow-lg"
                />
              </div>
              
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Order Placed Successfully!
              </h2>
              
              <p className="text-lg text-gray-600 mb-8">
                Thank you for choosing FusionForge PCs. Your custom PC build order has been received 
                and our team will contact you within 24 hours to confirm the details and discuss 
                the next steps.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h2 className="font-semibold text-blue-900 mb-3">What happens next?</h2>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>Our team will call you to confirm specifications and pricing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>We'll begin sourcing and assembling your custom PC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Quality testing and delivery coordination</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/builds">
                    Browse More Builds
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/contact">
                    Contact Support
                  </Link>
                </Button>
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Order placed on {new Date().toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Need immediate assistance? Call us at +91 9363599577
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}