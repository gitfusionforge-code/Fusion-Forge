import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingCart, Heart, Share2, AlertCircle, Phone, Mail } from "lucide-react";
import AddToCartButton from "@/components/add-to-cart-button";
import SEOHead from "@/components/enhanced-seo-head";
import { BuildDetailSkeleton, SpecificationTableSkeleton } from "@/components/enhanced-loading-states";
import { trackBuildView, trackPurchaseIntent } from "@/components/analytics-tracker";
import { formatPrice, formatBenchmarks } from "@/lib/utils";
import type { PcBuild, Component } from "@shared/schema";
import { useEffect, lazy, Suspense } from "react";
import LoadingSpinner from "@/components/loading-spinner";

// Lazy load heavy components
const SpecificationsTable = lazy(() => import("@/components/specifications-table"));
const PerformanceCharts = lazy(() => import("@/components/performance-charts"));

export default function BuildDetails() {
  const [match, params] = useRoute("/builds/:id");
  const buildId = params?.id ? parseInt(params.id) : null;

  const { data: build, isLoading: buildLoading, error: buildError } = useQuery<PcBuild>({
    queryKey: [`/api/builds/${buildId}`],
    enabled: !!buildId,
  });

  const { data: components, isLoading: componentsLoading } = useQuery<Component[]>({
    queryKey: [`/api/builds/${buildId}/components`],
    enabled: !!buildId,
  });

  // Track build view when data loads
  useEffect(() => {
    if (build) {
      trackBuildView(build.name, build.category);
    }
  }, [build]);

  if (!match || !buildId) {
    return (
      <div className="min-h-screen bg-light-grey flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Build ID</h1>
            <p className="text-gray-600">The requested PC build could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (buildLoading || componentsLoading) {
    return <BuildDetailSkeleton />;
  }

  if (buildError || !build) {
    return (
      <div className="min-h-screen bg-light-grey py-16 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-4">Build Not Found</h2>
            <p className="text-gray-600 mb-6">
              The requested PC build could not be found or is no longer available.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/builds">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Browse All Builds
                </Link>
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Remove benchmarks functionality as it's not in the new schema
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "budget":
        return "bg-green-100 text-success-green";
      case "mid-range":
        return "bg-blue-100 text-bright-blue";
      case "high-end":
        return "bg-purple-100 text-purple-600";
      case "premium":
        return "bg-orange-100 text-tech-orange";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-light-grey py-16">
      <SEOHead 
        title={`${build.name} - ${build.category} PC Build`}
        description={`${build.description || 'Complete PC build'} Featuring ${build.processor}, ${build.gpu || 'integrated graphics'}, and ${build.ram}. Starting at ${formatPrice(build.totalPrice)}.`}
        keywords={`${build.name}, ${build.category} PC, ${build.processor}, ${build.gpu || 'integrated'}, gaming computer, workstation`}
        image={build.imageUrl || '/api/placeholder/400/300'}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-3xl lg:text-4xl font-bold text-deep-blue">{build.name}</h1>
            <Badge className={`px-3 py-1 rounded text-lg font-semibold ${getCategoryColor(build.category)}`}>
              {formatPrice(build.totalPrice)}
            </Badge>
          </div>
          <p className="text-lg text-gray-600">{build.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <img 
              src={build.imageUrl ?? '/api/placeholder/400/300'} 
              alt={build.name} 
              className="rounded-xl shadow-lg w-full h-auto mb-6" 
            />
            
            <Card className="bg-gray-50 rounded-lg">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-deep-blue mb-4">Build Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Build Type:</span>
                    <span className="font-semibold text-success-green">{build.buildType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget Range:</span>
                    <span className="font-semibold text-success-green">{build.budgetRange}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-semibold text-success-green">{build.category}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {components && components.length > 0 ? (
            <Suspense fallback={<SpecificationTableSkeleton />}>
              <SpecificationsTable 
                components={components} 
                totalPrice={build.totalPrice.toString()}
                buildName={build.name}
              />
            </Suspense>
          ) : (
            <Card className="bg-gray-50 rounded-xl">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold text-deep-blue mb-6">Basic Specifications</h3>
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-medium text-gray-700">Processor</span>
                    <span className="text-gray-600">{build.processor}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-medium text-gray-700">Graphics Card</span>
                    <span className="text-gray-600">{build.gpu || 'Integrated'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-medium text-gray-700">Memory</span>
                    <span className="text-gray-600">{build.ram}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-medium text-gray-700">Storage</span>
                    <span className="text-gray-600">{build.storage}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-medium text-gray-700">Motherboard</span>
                    <span className="text-gray-600">{build.motherboard}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="font-medium text-gray-700">Case & PSU</span>
                    <span className="text-gray-600">{build.casePsu}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <AddToCartButton 
            build={build} 
            size="lg"
            className="px-8 py-4 text-lg font-semibold"
          />
          <Button 
            variant="outline" 
            className="px-8 py-4 rounded-lg font-semibold text-lg"
            asChild
          >
            <Link href="/contact">
              <Phone className="mr-2 h-5 w-5" />
              Request Custom Quote
            </Link>
          </Button>
          <Button variant="outline" className="px-8 py-4 rounded-lg font-semibold text-lg">
            <Mail className="mr-2 h-5 w-5" />
            Share Build
          </Button>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link href="/builds">
            <Button variant="outline" className="inline-flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Builds
            </Button>
          </Link>
        </div>

        {/* Performance Charts */}
        {build && (
          <div className="mt-12">
            <Suspense fallback={<LoadingSpinner />}>
              <PerformanceCharts build={build} />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}
