import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Monitor, Gamepad2, Zap, Cpu } from "lucide-react";
import { formatBenchmarks } from "@/lib/utils";

interface PerformanceBenchmarksProps {
  benchmarks: string;
  buildName: string;
  category: string;
}

export default function PerformanceBenchmarks({ 
  benchmarks, 
  buildName, 
  category 
}: PerformanceBenchmarksProps) {
  const benchmarkData = formatBenchmarks(benchmarks);
  
  const getPerformanceIcon = (benchmark: string) => {
    const lower = benchmark.toLowerCase();
    if (lower.includes('gaming') || lower.includes('fps')) return Gamepad2;
    if (lower.includes('video') || lower.includes('editing')) return Monitor;
    if (lower.includes('rendering') || lower.includes('ai')) return Cpu;
    return Zap;
  };

  const getPerformanceScore = (value: string, category: string) => {
    const lower = value.toLowerCase();
    
    // Extract FPS numbers
    const fpsMatch = value.match(/(\d+)\+?\s*fps/i);
    if (fpsMatch) {
      const fps = parseInt(fpsMatch[1]);
      if (fps >= 120) return 95;
      if (fps >= 90) return 85;
      if (fps >= 60) return 75;
      if (fps >= 30) return 55;
      return 35;
    }
    
    // Performance keywords
    if (lower.includes('excellent') || lower.includes('maximum') || lower.includes('unmatched')) return 95;
    if (lower.includes('professional') || lower.includes('server') || lower.includes('ultimate')) return 90;
    if (lower.includes('fast') || lower.includes('smooth') || lower.includes('real-time')) return 85;
    if (lower.includes('good') || lower.includes('ready')) return 75;
    if (lower.includes('basic') || lower.includes('light')) return 60;
    
    // Category-based scoring
    switch (category) {
      case 'premium': return 95;
      case 'high-end': return 85;
      case 'mid-range': return 75;
      case 'budget': return 60;
      default: return 70;
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-deep-blue flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Performance Benchmarks - {buildName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(benchmarkData).map(([benchmark, value], index) => {
            const Icon = getPerformanceIcon(benchmark);
            const score = getPerformanceScore(value, category);
            const colorClass = getPerformanceColor(score);
            
            return (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-800">{benchmark}</span>
                  </div>
                  <Badge variant="outline" className={colorClass}>
                    {value}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Performance Score</span>
                    <span>{score}/100</span>
                  </div>
                  <Progress 
                    value={score} 
                    className="h-2"
                  />
                </div>
              </div>
            );
          })}
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Performance Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-green-600">Gaming</div>
                <div className="text-gray-600">
                  {category === 'premium' ? 'Elite' : 
                   category === 'high-end' ? 'Excellent' : 
                   category === 'mid-range' ? 'Very Good' : 'Good'}
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-blue-600">Productivity</div>
                <div className="text-gray-600">
                  {category === 'premium' ? 'Professional' : 
                   category === 'high-end' ? 'Advanced' : 
                   category === 'mid-range' ? 'Efficient' : 'Capable'}
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-purple-600">Content Creation</div>
                <div className="text-gray-600">
                  {category === 'premium' ? 'Studio-Grade' : 
                   category === 'high-end' ? 'Professional' : 
                   category === 'mid-range' ? 'Capable' : 'Basic'}
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-orange-600">Future-Proof</div>
                <div className="text-gray-600">
                  {category === 'premium' ? '5+ Years' : 
                   category === 'high-end' ? '4+ Years' : 
                   category === 'mid-range' ? '3+ Years' : '2+ Years'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}