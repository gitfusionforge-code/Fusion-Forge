import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, SlidersHorizontal, GitCompare } from "lucide-react";
import BuildCard from "@/components/build-card";
import { BuildCardSkeleton } from "@/components/enhanced-loading-states";
import BuildComparison from "@/components/build-comparison";
import CustomPCCTA from "@/components/custom-pc-cta";
import SEOHead from "@/components/enhanced-seo-head";
import type { PcBuild } from "@shared/schema";

export default function Builds() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [selectedBuilds, setSelectedBuilds] = useState<PcBuild[]>([]);

  const { data: builds, isLoading, error } = useQuery<PcBuild[]>({
    queryKey: ["/api/builds"],
  });

  const categories = useMemo(() => [
    { id: "all", label: "All Builds", range: "", count: builds?.length || 0 },
    { id: "Student Essentials", label: "Student Essentials", range: "₹10,000-15,000", count: builds?.filter(b => b.category === "Student Essentials").length || 0 },
    { id: "Budget Creators", label: "Budget Creators", range: "₹30,000", count: builds?.filter(b => b.category === "Budget Creators").length || 0 },
    { id: "Student Gaming & Productivity", label: "Student Gaming & Productivity", range: "₹50,000", count: builds?.filter(b => b.category === "Student Gaming & Productivity").length || 0 },
    { id: "Mid-Tier Creators & Gamers", label: "Mid-Tier Creators & Gamers", range: "₹1,00,000", count: builds?.filter(b => b.category === "Mid-Tier Creators & Gamers").length || 0 },
  ], [builds]);

  const priceRanges = [
    { value: "all", label: "All Prices" },
    { value: "0-50000", label: "Under ₹50,000" },
    { value: "50000-100000", label: "₹50,000 - ₹1,00,000" },
    { value: "100000-200000", label: "₹1,00,000 - ₹2,00,000" },
    { value: "200000+", label: "Above ₹2,00,000" },
  ];

  const filteredBuilds = useMemo(() => {
    return builds?.filter(build => {
      const matchesCategory = selectedCategory === "all" || build.category === selectedCategory;
      const matchesSearch = searchQuery === "" || 
        build.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (build.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        build.processor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (build.gpu || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const buildPrice = build.totalPrice;
      let matchesPrice = true;
      if (priceRange !== "all") {
        if (priceRange === "0-50000") matchesPrice = buildPrice < 50000;
        else if (priceRange === "50000-100000") matchesPrice = buildPrice >= 50000 && buildPrice < 100000;
        else if (priceRange === "100000-200000") matchesPrice = buildPrice >= 100000 && buildPrice < 200000;
        else if (priceRange === "200000+") matchesPrice = buildPrice >= 200000;
      }
      
      return matchesCategory && matchesSearch && matchesPrice;
    })?.sort((a, b) => {
      if (sortBy === "price-low") return a.totalPrice - b.totalPrice;
      if (sortBy === "price-high") return b.totalPrice - a.totalPrice;
      return a.name.localeCompare(b.name);
    }) || [];
  }, [builds, selectedCategory, searchQuery, priceRange, sortBy]);

  const handleBuildSelect = useCallback((build: PcBuild) => {
    setSelectedBuilds(prev => {
      if (prev.find(b => b.id === build.id)) {
        return prev.filter(b => b.id !== build.id);
      } else if (prev.length < 3) {
        return [...prev, build];
      }
      return prev;
    });
  }, []);

  const handleRemoveBuild = (buildId: number) => {
    setSelectedBuilds(selectedBuilds.filter(b => b.id !== buildId));
  };

  return (
    <div className="min-h-screen bg-light-grey py-16">
      <SEOHead 
        title="PC Build Collection - All Categories"
        description="Browse our complete collection of custom PC builds from budget gaming computers to premium workstations. Filter by price, category, and specifications."
        keywords="PC builds, gaming computers, workstations, budget PCs, high-end computers, custom builds"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-deep-blue mb-4">
            PC Build Collection
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Discover our curated PC configurations with advanced search and filtering
          </p>
        </div>

        {/* Advanced Search and Filter Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search builds, components..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label} ({category.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Price Range Filter */}
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger>
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  {priceRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort Options */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results Summary and Compare Toggle */}
            <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
              <span>
                Showing {filteredBuilds.length} of {builds?.length || 0} builds
              </span>
              <div className="flex gap-2">
                <Button
                  variant={compareMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setCompareMode(!compareMode);
                    if (!compareMode) setSelectedBuilds([]);
                  }}
                  className={compareMode ? "bg-tech-orange hover:bg-orange-600" : ""}
                >
                  <GitCompare className="h-4 w-4 mr-2" />
                  Compare ({selectedBuilds.length}/3)
                </Button>
                {(searchQuery || selectedCategory !== "all" || priceRange !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setPriceRange("all");
                      setSortBy("name");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <BuildCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-bold text-red-600 mb-4">Unable to Load Builds</h2>
              <p className="text-gray-600 mb-4">
                We're having trouble connecting to our servers. Please try refreshing the page.
              </p>
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredBuilds.length === 0 && (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-bold text-gray-700 mb-4">No Builds Found</h2>
              <p className="text-gray-600 mb-4">
                No PC builds match your current filters. Try adjusting your search criteria.
              </p>
              <Button onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setPriceRange("all");
              }}>
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Build Comparison Section */}
        {compareMode && selectedBuilds.length > 0 && (
          <div className="mb-8">
            <BuildComparison
              builds={selectedBuilds}
              onRemoveBuild={handleRemoveBuild}
              onAddMore={() => setCompareMode(false)}
            />
          </div>
        )}

        {/* PC Build Grid */}
        {!isLoading && !error && filteredBuilds.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBuilds.map((build) => (
              <div 
                key={build.id}
                className={`relative ${compareMode ? 'cursor-pointer' : ''}`}
                onClick={() => compareMode && handleBuildSelect(build)}
              >
                {compareMode && (
                  <div className="absolute top-2 right-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedBuilds.some(b => b.id === build.id)}
                      onChange={() => handleBuildSelect(build)}
                      className="w-5 h-5 text-tech-orange bg-gray-100 border-gray-300 rounded focus:ring-tech-orange focus:ring-2"
                      disabled={!selectedBuilds.some(b => b.id === build.id) && selectedBuilds.length >= 3}
                    />
                  </div>
                )}
                <BuildCard build={build} />
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Custom PC Buying Options */}
      <CustomPCCTA />
    </div>
  );
}
