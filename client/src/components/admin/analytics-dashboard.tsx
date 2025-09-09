import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { TrendingUp, Users, Eye, MousePointer, Clock, Filter, Download, RefreshCw } from 'lucide-react';

interface HeatmapData {
  x: number;
  y: number;
  intensity: number;
  element?: string;
  page: string;
}

interface FunnelStep {
  stepName: string;
  stepOrder: number;
  totalUsers: number;
  conversions: number;
  conversionRate: number;
  dropOffRate: number;
  averageTimeToNext: number;
}

interface ABTest {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'paused';
  variants: Array<{
    variantId: string;
    name: string;
    participants: number;
    conversionRate: number;
    isWinner: boolean;
  }>;
  startDate: string;
  endDate?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsDashboard() {
  const [selectedPage, setSelectedPage] = useState('/');
  const [dateRange, setDateRange] = useState('7d');
  
  // Fetch analytics data from our services
  const { data: funnelData } = useQuery({
    queryKey: ['analytics', 'funnel', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/funnel?dateRange=${dateRange}`);
      if (!response.ok) return [];
      return response.json();
    }
  });

  const { data: abTests } = useQuery({
    queryKey: ['analytics', 'ab-tests'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/ab-tests');
      if (!response.ok) return [];
      return response.json();
    }
  });

  const { data: heatmapData } = useQuery({
    queryKey: ['analytics', 'heatmap', selectedPage],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/heatmap?page=${encodeURIComponent(selectedPage)}`);
      if (!response.ok) return [];
      return response.json();
    }
  });

  const performanceData = [
    { metric: 'Page Load Time', value: '2.3s', change: -12, status: 'good' },
    { metric: 'First Contentful Paint', value: '1.8s', change: -8, status: 'good' },
    { metric: 'Largest Contentful Paint', value: '3.2s', change: 15, status: 'needs-improvement' },
    { metric: 'Cumulative Layout Shift', value: '0.08', change: -25, status: 'good' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Comprehensive analytics and user behavior insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold">12,543</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-green-600 mt-1">↑ 12% vs last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Page Views</p>
                <p className="text-2xl font-bold">45,231</p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-green-600 mt-1">↑ 8% vs last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">14.2%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-xs text-red-600 mt-1">↓ 2% vs last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Session Time</p>
                <p className="text-2xl font-bold">4m 32s</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-xs text-green-600 mt-1">↑ 5% vs last week</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="heatmaps">Heatmaps</TabsTrigger>
          <TabsTrigger value="ab-testing">A/B Testing</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelData?.map((step, index) => (
                  <div key={step.stepName} className="flex items-center space-x-4">
                    <div className="w-32 text-sm font-medium">{step.stepName}</div>
                    <div className="flex-1">
                      <div className="bg-gray-200 rounded-full h-4 relative overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${step.conversionRate}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                          {step.conversions} users ({step.conversionRate.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                    <div className="w-20 text-sm text-gray-600">
                      {step.dropOffRate > 0 && `↓ ${step.dropOffRate.toFixed(1)}%`}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Click Heatmap</span>
                <select 
                  value={selectedPage} 
                  onChange={(e) => setSelectedPage(e.target.value)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="/">Homepage</option>
                  <option value="/builds">PC Builds</option>
                  <option value="/configurator">Configurator</option>
                  <option value="/about">About</option>
                </select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-100 rounded-lg" style={{ height: '400px' }}>
                {/* Heatmap visualization placeholder */}
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MousePointer className="h-12 w-12 mx-auto mb-2" />
                    <p>Interactive heatmap for {selectedPage}</p>
                    <p className="text-sm">Showing {heatmapData?.length} click points</p>
                  </div>
                </div>
                {/* Render heatmap dots */}
                {heatmapData?.slice(0, 20).map((point, index) => (
                  <div
                    key={index}
                    className="absolute w-4 h-4 bg-red-500 rounded-full opacity-70"
                    style={{
                      left: `${Math.min(point.x / 1200 * 100, 95)}%`,
                      top: `${Math.min(point.y / 800 * 100, 95)}%`,
                      opacity: point.intensity / 100 * 0.8 + 0.2
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ab-testing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {abTests?.map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{test.name}</CardTitle>
                    <Badge variant={test.status === 'running' ? 'default' : 'secondary'}>
                      {test.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {test.variants.map((variant) => (
                    <div key={variant.variantId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{variant.name}</span>
                        {variant.isWinner && <Badge variant="outline">Winner</Badge>}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{variant.participants} participants</span>
                        <span>{variant.conversionRate}% conversion</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-full rounded-full ${variant.isWinner ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(variant.conversionRate * 5, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Core Web Vitals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {performanceData.map((metric) => (
                  <div key={metric.metric} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{metric.metric}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={metric.status === 'good' ? 'default' : 'destructive'}
                        className="mb-1"
                      >
                        {metric.status === 'good' ? 'Good' : 'Needs Improvement'}
                      </Badge>
                      <p className={`text-sm ${metric.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {metric.change > 0 ? '↑' : '↓'} {Math.abs(metric.change)}%
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Page Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={[
                    { name: 'Mon', lcp: 2.8, fid: 45, cls: 0.12 },
                    { name: 'Tue', lcp: 3.2, fid: 52, cls: 0.08 },
                    { name: 'Wed', lcp: 2.9, fid: 48, cls: 0.15 },
                    { name: 'Thu', lcp: 2.6, fid: 41, cls: 0.09 },
                    { name: 'Fri', lcp: 3.1, fid: 55, cls: 0.11 },
                    { name: 'Sat', lcp: 2.8, fid: 43, cls: 0.07 },
                    { name: 'Sun', lcp: 2.7, fid: 39, cls: 0.08 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="lcp" stroke="#8884d8" />
                    <Line type="monotone" dataKey="fid" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}