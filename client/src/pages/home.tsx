import { useQuery } from "@tanstack/react-query";
import HeroSection from "@/components/hero-section";
import BuildCard from "@/components/build-card";
import CustomPCCTA from "@/components/custom-pc-cta";
import SEOHead from "@/components/enhanced-seo-head";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import type { PcBuild } from "@shared/schema";

export default function Home() {
  const { data: builds, isLoading, error } = useQuery<PcBuild[]>({
    queryKey: ["/api/builds"],
  });

  const featuredBuilds = builds?.slice(0, 4) || [];

  return (
    <div className="min-h-screen bg-light-grey">
      <SEOHead 
        title="Fusion Forge PCs - Custom Gaming & Workstation Computers"
        description="Professional PC building service by Fusion Forge PCs. Premium custom gaming and workstation computers from budget builds to extreme performance rigs with latest components."
        keywords="Fusion Forge PCs, custom PC builds, gaming computers, workstation PCs, computer building service, high-end gaming rigs"
      />
      <HeroSection />
      
      {/* Featured Builds Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold fusion-text-gradient mb-4">
              PC Builds by Price Range
            </h2>
            <p className="text-lg text-gray-800 font-medium max-w-3xl mx-auto">
              Choose from our carefully curated PC configurations designed for different budgets and performance needs
            </p>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg h-96 animate-pulse">
                  <div className="w-full h-48 bg-gray-200 rounded-t-xl"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-600">Failed to load PC builds. Please try again later.</p>
            </div>
          )}

          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredBuilds.map((build) => (
                <BuildCard key={build.id} build={build} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/builds">
              <Button className="fusion-gradient text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity border-0">
                View All Builds
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Custom PC Buying Options */}
      <CustomPCCTA />
    </div>
  );
}
