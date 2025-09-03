import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, ShoppingCart, Cpu, HardDrive, MemoryStick, CheckCircle, Eye } from "lucide-react";
import LazyImage from "@/components/image-with-lazy-loading";
import AddToCartButton from "@/components/add-to-cart-button";
import ProtectedCheckout from "@/components/auth/ProtectedCheckout";
import type { PcBuild } from "@shared/schema";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, memo, useMemo, useCallback } from "react";

interface BuildCardProps {
  build: PcBuild;
  isSelected?: boolean;
  onSelect?: () => void;
  canSelect?: boolean;
  viewMode?: "grid" | "list";
}

const BuildCard = memo(function BuildCard({ 
  build, 
  isSelected = false, 
  onSelect, 
  canSelect = true, 
  viewMode = "grid" 
}: BuildCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSaved, setIsSaved] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if build is already saved
  const { data: savedBuilds = [] } = useQuery({
    queryKey: [`/api/user/${user?.uid}/saved-builds`],
    enabled: !!user?.uid,
  });

  // Update local saved state when data changes
  useEffect(() => {
    if (Array.isArray(savedBuilds)) {
      const buildIsSaved = savedBuilds.some((saved: any) => saved.buildId === build.id);
      setIsSaved(buildIsSaved);
    }
  }, [savedBuilds, build.id]);

  // Save build mutation
  const saveBuildMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/user/${user?.uid}/saved-builds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildId: build.id }),
      });
      if (!response.ok) throw new Error('Failed to save build');
      return response.json();
    },
    onSuccess: () => {
      setIsSaved(true);
      setIsProcessing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.uid}/saved-builds`] });
    },
    onError: () => {
      setIsProcessing(false);
    },
  });

  // Remove build mutation
  const removeBuildMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/user/${user?.uid}/saved-builds/${build.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove build');
    },
    onSuccess: () => {
      setIsSaved(false);
      setIsProcessing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.uid}/saved-builds`] });
    },
    onError: () => {
      setIsProcessing(false);
    },
  });

  const handleSaveToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user || isProcessing || saveBuildMutation.isPending || removeBuildMutation.isPending) return;
    
    setIsProcessing(true);
    
    if (isSaved) {
      removeBuildMutation.mutate();
    } else {
      saveBuildMutation.mutate();
    }
  }, [user, isProcessing, saveBuildMutation, removeBuildMutation, isSaved]);

  const categoryColor = useMemo(() => {
    switch (build.category) {
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
  }, [build.category]);

  return (
    <Card className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-1 flex flex-col h-full group min-h-[500px]">
      <div className="relative overflow-hidden h-48">
        <LazyImage 
          src={build.imageUrl || '/api/placeholder/400/300'} 
          alt={build.name} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          fallback="/api/placeholder/400/300"
          width={400}
          height={300}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Heart/Save Button */}
        {user && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full shadow-sm"
            onClick={handleSaveToggle}
            disabled={saveBuildMutation.isPending || removeBuildMutation.isPending || isProcessing}
          >
            <Heart 
              className={`h-4 w-4 transition-all duration-200 ${
                isSaved 
                  ? 'fill-red-500 text-red-500 scale-110' 
                  : 'text-gray-600 hover:text-red-500 hover:scale-110'
              }`} 
            />
          </Button>
        )}
      </div>
      <CardContent className="p-6 flex flex-col flex-grow justify-between min-h-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-deep-blue">{build.name}</h3>
          <Badge className={`px-2 py-1 rounded text-sm font-semibold ${categoryColor}`}>
            {formatPrice(build.totalPrice)}
          </Badge>
        </div>
        <p className="text-gray-600 mb-4 text-sm">{build.description}</p>
        <div className="space-y-2 mb-4 flex-grow">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">CPU:</span>
            <span className="font-medium">{build.processor}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">GPU:</span>
            <span className="font-medium">{build.gpu || 'Integrated'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">RAM:</span>
            <span className="font-medium">{build.ram}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Storage:</span>
            <span className="font-medium">{build.storage}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-auto pt-4 pb-3">
          <AddToCartButton 
            build={build} 
            variant="default"
            size="default"
            className="w-full h-12 flex items-center justify-center text-sm px-3"
          />
          <Button asChild variant="outline" className="w-full h-10 flex items-center justify-center border-2 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group/btn text-sm">
            <Link href={`/builds/${build.id}`} className="flex items-center justify-center w-full h-full px-3">
              <Eye className="mr-2 h-4 w-4 group-hover/btn:scale-110 transition-transform" />
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

export default BuildCard;
