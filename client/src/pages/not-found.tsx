import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/enhanced-seo-head";
import { Link } from "wouter";
import { Home, Search, ArrowLeft, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-light-grey py-16">
      <SEOHead 
        title="Page Not Found - FusionForge PCs"
        description="The page you're looking for doesn't exist. Return to our homepage to explore custom PC builds and services."
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Error Code */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-tech-orange opacity-50">404</h1>
          </div>

          {/* Error Message */}
          <Card className="max-w-2xl mx-auto mb-8">
            <CardContent className="p-12 text-center">
              <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-deep-blue mb-4">
                Page Not Found
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you may have entered an incorrect URL.
              </p>
              
              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/">
                  <Button className="w-full bg-tech-orange hover:bg-orange-600 text-white">
                    <Home className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
                <Link href="/builds">
                  <Button variant="outline" className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    Browse PC Builds
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Helpful Links */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <Link to="/builds">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Search className="h-8 w-8 text-tech-orange mx-auto mb-3" />
                  <h3 className="font-semibold text-deep-blue mb-2">PC Builds</h3>
                  <p className="text-sm text-gray-600">Explore our custom configurations</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/services">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <HelpCircle className="h-8 w-8 text-tech-orange mx-auto mb-3" />
                  <h3 className="font-semibold text-deep-blue mb-2">Services</h3>
                  <p className="text-sm text-gray-600">Learn about our offerings</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/contact">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <ArrowLeft className="h-8 w-8 text-tech-orange mx-auto mb-3" />
                  <h3 className="font-semibold text-deep-blue mb-2">Contact</h3>
                  <p className="text-sm text-gray-600">Get a custom quote</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/faq">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <HelpCircle className="h-8 w-8 text-tech-orange mx-auto mb-3" />
                  <h3 className="font-semibold text-deep-blue mb-2">FAQ</h3>
                  <p className="text-sm text-gray-600">Find quick answers</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}