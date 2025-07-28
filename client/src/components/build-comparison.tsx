import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Cpu, HardDrive, Zap } from "lucide-react";
import type { PcBuild } from "@shared/schema";
import { formatPrice } from "@/lib/utils";

interface BuildComparisonProps {
  builds: PcBuild[];
  onRemoveBuild: (buildId: number) => void;
  onAddMore: () => void;
}

export default function BuildComparison({ builds, onRemoveBuild, onAddMore }: BuildComparisonProps) {
  if (builds.length === 0) {
    return (
      <Card className="bg-white">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <Plus className="h-12 w-12 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-600">No builds selected</h3>
            <p className="text-gray-500">Add builds to compare their specifications and prices</p>
            <Button onClick={onAddMore} className="bg-tech-orange hover:bg-orange-600">
              Browse Builds
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const specs = [
    { key: 'cpu', label: 'Processor', icon: Cpu },
    { key: 'gpu', label: 'Graphics Card', icon: HardDrive },
    { key: 'ram', label: 'Memory', icon: HardDrive },
    { key: 'storage', label: 'Storage', icon: HardDrive },
    { key: 'motherboard', label: 'Motherboard', icon: HardDrive },
    { key: 'powerSupply', label: 'Power Supply', icon: Zap },
    { key: 'case', label: 'Case', icon: HardDrive },
  ];

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-deep-blue flex items-center justify-between">
          Build Comparison
          <Button 
            onClick={onAddMore} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add More
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left py-3 pr-4 font-semibold text-dark-slate min-w-[120px]">
                  Specification
                </th>
                {builds.map((build) => (
                  <th key={build.id} className="text-center py-3 px-4 min-w-[200px]">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-deep-blue text-sm mb-1">
                          {build.name}
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-tech-orange/10 text-tech-orange"
                        >
                          {build.category}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveBuild(build.id)}
                        className="ml-2 h-8 w-8 p-0 hover:bg-red-100"
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4 font-semibold text-gray-700">Price</td>
                {builds.map((build) => (
                  <td key={build.id} className="py-3 px-4 text-center">
                    <div className="font-bold text-lg text-tech-orange">
                      {formatPrice(build.totalPrice)}
                    </div>
                  </td>
                ))}
              </tr>
              
              {specs.map((spec) => (
                <tr key={spec.key} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium text-gray-700 flex items-center gap-2">
                    <spec.icon className="h-4 w-4 text-gray-400" />
                    {spec.label}
                  </td>
                  {builds.map((build) => (
                    <td key={build.id} className="py-3 px-4 text-center text-sm">
                      <div className="break-words">
                        {build[spec.key as keyof PcBuild] as string}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4 font-medium text-gray-700">Category</td>
                {builds.map((build) => (
                  <td key={build.id} className="py-3 px-4 text-center">
                    <Badge 
                      variant="outline"
                      className="capitalize"
                    >
                      {build.category}
                    </Badge>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        
        <Separator className="my-6" />
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {builds.map((build) => (
            <Button
              key={build.id}
              className="bg-tech-orange hover:bg-orange-600 flex-1 max-w-xs"
            >
              Choose {build.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}