import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Search, Filter, X, SlidersHorizontal, Grid, List } from "lucide-react";

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: SearchFilters) => void;
  onSortChange: (sort: SortOption) => void;
  onViewModeChange: (mode: "grid" | "list") => void;
  categories: string[];
  priceRanges: { label: string; min: number; max: number }[];
  currentFilters: SearchFilters;
  viewMode: "grid" | "list";
}

export interface SearchFilters {
  category: string;
  priceRange: { min: number; max: number } | null;
  useCase: string;
  cpuBrand: string;
  gpuBrand: string;
  ramSize: string;
  storageType: string;
  performanceScore: { min: number; max: number } | null;
}

export interface SortOption {
  field: "price" | "performance" | "name" | "category";
  direction: "asc" | "desc";
}

export default function EnhancedSearchFilter({ 
  onSearch, 
  onFilterChange,
  onSortChange,
  onViewModeChange,
  categories, 
  priceRanges,
  currentFilters,
  viewMode
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([50000, 300000]);
  const [performanceRange, setPerformanceRange] = useState([60, 100]);
  const [sortOption, setSortOption] = useState<SortOption>({ field: "price", direction: "asc" });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...currentFilters, [key]: value };
    onFilterChange(newFilters);
  };

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange(values);
    handleFilterChange('priceRange', { min: values[0], max: values[1] });
  };

  const handlePerformanceRangeChange = (values: number[]) => {
    setPerformanceRange(values);
    handleFilterChange('performanceScore', { min: values[0], max: values[1] });
  };

  const clearAllFilters = () => {
    const resetFilters: SearchFilters = {
      category: "",
      priceRange: null,
      useCase: "",
      cpuBrand: "",
      gpuBrand: "",
      ramSize: "",
      storageType: "",
      performanceScore: null
    };
    onFilterChange(resetFilters);
    setSearchQuery("");
    setPriceRange([50000, 300000]);
    setPerformanceRange([60, 100]);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (currentFilters.category) count++;
    if (currentFilters.priceRange) count++;
    if (currentFilters.useCase) count++;
    if (currentFilters.cpuBrand) count++;
    if (currentFilters.gpuBrand) count++;
    if (currentFilters.ramSize) count++;
    if (currentFilters.storageType) count++;
    if (currentFilters.performanceScore) count++;
    return count;
  };

  const handleSortChange = (field: string, direction: string) => {
    const newSort = { field: field as SortOption["field"], direction: direction as SortOption["direction"] };
    setSortOption(newSort);
    onSortChange(newSort);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Advanced
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => onViewModeChange("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => onViewModeChange("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search PC builds, components, or specifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {/* Quick Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Select value={currentFilters.category} onValueChange={(value) => handleFilterChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={currentFilters.useCase} onValueChange={(value) => handleFilterChange('useCase', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Use Case" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Use Cases</SelectItem>
              <SelectItem value="gaming">Gaming</SelectItem>
              <SelectItem value="content-creation">Content Creation</SelectItem>
              <SelectItem value="workstation">Workstation</SelectItem>
              <SelectItem value="office">Office</SelectItem>
              <SelectItem value="ai-ml">AI/ML</SelectItem>
            </SelectContent>
          </Select>

          <Select value={`${sortOption.field}-${sortOption.direction}`} onValueChange={(value) => {
            const [field, direction] = value.split('-');
            handleSortChange(field, direction);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="performance-desc">Performance: High to Low</SelectItem>
              <SelectItem value="performance-asc">Performance: Low to High</SelectItem>
              <SelectItem value="name-asc">Name: A to Z</SelectItem>
              <SelectItem value="name-desc">Name: Z to A</SelectItem>
            </SelectContent>
          </Select>

          {getActiveFilterCount() > 0 && (
            <Button variant="outline" onClick={clearAllFilters} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <>
            <Separator />
            <div className="space-y-6">
              {/* Price Range */}
              <div>
                <label className="text-sm font-medium mb-3 block">
                  Price Range: ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={handlePriceRangeChange}
                  min={30000}
                  max={500000}
                  step={10000}
                  className="w-full"
                />
              </div>

              {/* Performance Range */}
              <div>
                <label className="text-sm font-medium mb-3 block">
                  Performance Score: {performanceRange[0]} - {performanceRange[1]}
                </label>
                <Slider
                  value={performanceRange}
                  onValueChange={handlePerformanceRangeChange}
                  min={50}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Component Filters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Select value={currentFilters.cpuBrand} onValueChange={(value) => handleFilterChange('cpuBrand', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="CPU Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any CPU</SelectItem>
                    <SelectItem value="intel">Intel</SelectItem>
                    <SelectItem value="amd">AMD</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={currentFilters.gpuBrand} onValueChange={(value) => handleFilterChange('gpuBrand', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="GPU Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any GPU</SelectItem>
                    <SelectItem value="nvidia">NVIDIA</SelectItem>
                    <SelectItem value="amd">AMD</SelectItem>
                    <SelectItem value="integrated">Integrated</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={currentFilters.ramSize} onValueChange={(value) => handleFilterChange('ramSize', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="RAM Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any RAM</SelectItem>
                    <SelectItem value="8gb">8GB</SelectItem>
                    <SelectItem value="16gb">16GB</SelectItem>
                    <SelectItem value="32gb">32GB</SelectItem>
                    <SelectItem value="64gb">64GB+</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={currentFilters.storageType} onValueChange={(value) => handleFilterChange('storageType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Storage Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any Storage</SelectItem>
                    <SelectItem value="ssd">SSD</SelectItem>
                    <SelectItem value="nvme">NVMe SSD</SelectItem>
                    <SelectItem value="hdd">HDD</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}