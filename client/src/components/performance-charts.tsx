import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Monitor, Cpu, Zap, TrendingUp, Gamepad2, CheckCircle } from "lucide-react";
import type { PcBuild } from "@shared/schema";

// Enhanced benchmark parsing function
function formatBenchmarks(benchmarksString: string) {
  try {
    return JSON.parse(benchmarksString);
  } catch {
    return {};
  }
}

interface PerformanceChartsProps {
  build: PcBuild;
}

export default function PerformanceCharts({ build }: PerformanceChartsProps) {
  const benchmarkData = useMemo(() => {
    // Mock benchmark data since build.benchmarks doesn't exist in the schema
    const benchmarks = {
      "Gaming": "Smooth gaming performance",
      "Productivity": "Fast office work",
      "Rendering": "Good performance"
    };
    return Object.entries(benchmarks).map(([game, performance]) => {
      let fps = 0;
      let score = 50;
      
      if (typeof performance === 'string') {
        const fpsMatch = performance.match(/(\d+)/);
        if (fpsMatch) {
          fps = parseInt(fpsMatch[1]);
          score = Math.min(100, fps * 0.8);
        } else if (performance.toLowerCase().includes('excellent')) {
          score = 95; fps = 120;
        } else if (performance.toLowerCase().includes('smooth') || performance.toLowerCase().includes('good')) {
          score = 80; fps = 60;
        } else if (performance.toLowerCase().includes('real-time')) {
          score = 100; fps = 60;
        } else if (performance.toLowerCase().includes('fast')) {
          score = 85; fps = 90;
        }
      }
      
      return { game, fps, score, performance };
    });
  }, [build.id]);

  const performanceMetrics = useMemo(() => {
    const avgScore = benchmarkData.reduce((acc, curr) => acc + curr.score, 0) / Math.max(benchmarkData.length, 1);
    
    // Performance tier calculation
    let tier = "Entry Level";
    let tierColor = "text-gray-600";
    let recommendation = "Basic computing tasks";
    
    if (avgScore >= 90) {
      tier = "Enthusiast";
      tierColor = "text-red-600";
      recommendation = "Perfect for 4K gaming and content creation";
    } else if (avgScore >= 80) {
      tier = "High Performance";
      tierColor = "text-purple-600";
      recommendation = "Great for 1440p gaming and streaming";
    } else if (avgScore >= 70) {
      tier = "Mid Range";
      tierColor = "text-blue-600";
      recommendation = "Excellent for 1080p gaming";
    } else if (avgScore >= 60) {
      tier = "Budget Gaming";
      tierColor = "text-green-600";
      recommendation = "Good for esports and light gaming";
    }
    
    // Performance categories
    const gamingFps = benchmarkData.filter(item => 
      item.game.toLowerCase().includes('game') || 
      item.game.toLowerCase().includes('fps') ||
      ['valorant', 'cs2', 'apex', 'cyberpunk'].some(game => 
        item.game.toLowerCase().includes(game)
      )
    );
    
    const productivityTasks = benchmarkData.filter(item =>
      ['editing', 'rendering', 'workload', 'office'].some(task =>
        item.game.toLowerCase().includes(task)
      )
    );
    
    return {
      avgScore: Math.round(avgScore),
      tier,
      tierColor,
      recommendation,
      gamingFps,
      productivityTasks,
      totalBenchmarks: benchmarkData.length
    };
  }, [benchmarkData]);

  // Generate performance insights
  const generateInsights = () => {
    const insights = [];
    
    if (performanceMetrics.avgScore >= 85) {
      insights.push("Excellent for 4K gaming and professional workloads");
    } else if (performanceMetrics.avgScore >= 75) {
      insights.push("Great for 1440p gaming and content creation");
    } else if (performanceMetrics.avgScore >= 65) {
      insights.push("Perfect for 1080p gaming and general productivity");
    } else {
      insights.push("Ideal for office tasks and light gaming");
    }
    
    if (performanceMetrics.gamingFps.length > 0) {
      const avgFps = performanceMetrics.gamingFps.reduce((acc, curr) => acc + curr.fps, 0) / performanceMetrics.gamingFps.length;
      if (avgFps >= 120) {
        insights.push("Supports high refresh rate gaming (120+ FPS)");
      } else if (avgFps >= 60) {
        insights.push("Smooth gaming experience at 60+ FPS");
      }
    }
    
    return insights;
  };

  const insights = generateInsights();

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-deep-blue">{performanceMetrics.avgScore}</div>
              <div className="text-sm text-gray-600">Performance Score</div>
              <Progress value={performanceMetrics.avgScore} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-tech-orange">{performanceMetrics.totalBenchmarks}</div>
              <div className="text-sm text-gray-600">Benchmarks</div>
            </div>
            <div className="text-center">
              <Badge variant="outline" className={`text-lg px-3 py-1 ${performanceMetrics.tierColor}`}>
                {performanceMetrics.tier}
              </Badge>
              <div className="text-sm text-gray-600 mt-1">Performance Tier</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {performanceMetrics.gamingFps.length > 0 
                  ? Math.round(performanceMetrics.gamingFps.reduce((acc, curr) => acc + curr.fps, 0) / performanceMetrics.gamingFps.length)
                  : '--'}
              </div>
              <div className="text-sm text-gray-600">Avg Gaming FPS</div>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Performance Insights</h4>
            <ul className="space-y-1">
              {insights.map((insight, index) => (
                <li key={index} className="text-sm text-blue-800 flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-blue-600" />
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Gaming Performance Chart */}
      {performanceMetrics.gamingFps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Gaming Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceMetrics.gamingFps}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="game" 
                  angle={0}
                  textAnchor="middle"
                  height={60}
                  interval={0}
                />
                <YAxis label={{ value: 'FPS', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value, name) => [`${value} FPS`, 'Performance']}
                  labelFormatter={(label) => `Game: ${label}`}
                />
                <Bar dataKey="fps" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Productivity Performance */}
      {performanceMetrics.productivityTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Productivity Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={performanceMetrics.productivityTasks}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="game" 
                  angle={0}
                  textAnchor="middle"
                  height={60}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* All Benchmarks */}
      {benchmarkData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Detailed Benchmarks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {benchmarkData.map((benchmark, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="font-medium text-sm">{benchmark.game}</div>
                  <div className="text-lg font-bold text-deep-blue">{String(benchmark.performance)}</div>
                  {benchmark.fps > 0 && (
                    <div className="text-sm text-gray-600">{benchmark.fps} FPS</div>
                  )}
                  <Progress value={benchmark.score} className="mt-2 h-2" />
                </div>
              ))}
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={benchmarkData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="game" 
                  angle={0}
                  textAnchor="middle"
                  height={60}
                  interval={0}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'fps' ? `${value} FPS` : `${value}%`, 
                    name === 'fps' ? 'Frames Per Second' : 'Performance Score'
                  ]}
                />
                <Bar dataKey="fps" fill="#3B82F6" name="fps" />
                <Bar dataKey="score" fill="#F59E0B" name="score" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}