import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Eye, ShoppingCart, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import UserLayout from "@/components/user-layout";
import SEOHead from "@/components/enhanced-seo-head";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useCartStore } from "@/lib/cart-store";

export default function ProfileBuilds() {
  const { user } = useAuth();
  const cartStore = useCartStore();
  const queryClient = useQueryClient();

  // Fetch user's actual saved builds
  const { data: savedBuilds = [], isLoading: savedBuildsLoading } = useQuery({
    queryKey: [`/api/user/${user?.uid}/saved-builds`],
    enabled: !!user?.uid,
  });

  // Fetch all builds to get pricing and details
  const { data: allBuilds = [], isLoading: buildsLoading } = useQuery({
    queryKey: ["/api/builds"],
  });

  // Remove saved build mutation
  const removeBuildMutation = useMutation({
    mutationFn: async (buildId: number) => {
      const response = await fetch(`/api/user/${user?.uid}/saved-builds/${buildId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove saved build');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.uid}/saved-builds`] });
    },
  });

  const isLoading = savedBuildsLoading || buildsLoading;

  // Get build details with pricing
  const savedBuildsWithDetails = (savedBuilds as any[]).map((savedBuild: any) => {
    const buildDetails = (allBuilds as any[]).find((build: any) => build.id === savedBuild.buildId);
    return {
      ...savedBuild,
      build: buildDetails
    };
  }).filter((item: any) => item.build); // Filter out builds that couldn't be found

  if (isLoading) {
    return (
      <UserLayout>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <SEOHead 
        title="My Builds"
        description="View and manage your saved PC builds and favorites"
      />
      <div className="max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-deep-blue">My Builds</h1>
          <p className="text-gray-600 mt-1">Your saved and favorited PC configurations</p>
        </div>

        {savedBuildsWithDetails.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved builds yet</h3>
              <p className="text-gray-600 mb-6">Start exploring our PC builds and save your favorites</p>
              <Link href="/builds">
                <Button className="bg-tech-orange hover:bg-orange-600">
                  Browse PC Builds
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {savedBuildsWithDetails.map((savedItem: any) => {
              const build = savedItem.build;
              return (
              <Card key={savedItem.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={build.imageUrl}
                        alt={build.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div>
                        <h3 className="text-xl font-semibold text-deep-blue">{build.name}</h3>
                        <p className="text-gray-600 mt-1">{build.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant="secondary"
                            className="capitalize"
                          >
                            {build.category}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            Saved on {new Date(savedItem.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-tech-orange mb-4">
                        {formatPrice(build.basePrice)}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/builds/${build.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => cartStore.addToCart(build)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          Add to Cart
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => removeBuildMutation.mutate(build.id)}
                          disabled={removeBuildMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </UserLayout>
  );
}