import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Cpu, HardDrive, MemoryStick, Zap, Monitor, Gamepad2, 
  AlertTriangle, CheckCircle, Info, Settings, TrendingUp,
  Thermometer, Volume2, DollarSign, Download, Share2, MessageCircle
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Link } from "wouter";

interface Component {
  id: string;
  name: string;
  price: number;
  performance: number;
  powerConsumption: number;
  socket?: string;
  memoryType?: string;
  formFactor?: string;
  category: string;
  cores?: number;
  clockSpeed?: number;
  vram?: number;
  capacity?: number;
  speed?: number;
  wattage?: number;
}

interface BuildConfig {
  cpu: Component | null;
  gpu: Component | null;
  ram: Component | null;
  storage: Component | null;
  motherboard: Component | null;
  psu: Component | null;
  case: Component | null;
  cooler: Component | null;
}

interface CompatibilityCheck {
  issues: Array<{type: 'error' | 'warning' | 'info', message: string}>;
  overallCompatible: boolean;
  compatibilityScore: number;
}

interface PerformancePrediction {
  gamingScore: number;
  productivityScore: number;
  fps: Record<string, number>;
  thermalRating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  noiseLevel: 'Silent' | 'Quiet' | 'Moderate' | 'Loud';
  futureProofing: number;
}

export default function EnhancedBuildConfigurator() {
  const [budget, setBudget] = useState<number>(100000);
  const [useCase, setUseCase] = useState<string>("gaming");
  const [autoOptimize, setAutoOptimize] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [config, setConfig] = useState<BuildConfig>({
    cpu: null,
    gpu: null,
    ram: null,
    storage: null,
    motherboard: null,
    psu: null,
    case: null,
    cooler: null,
  });

  // Enhanced component database with detailed specifications
  const components = {
    cpu: [
      { 
        id: "1", name: "AMD Ryzen 5 5600X", price: 18999, performance: 85, powerConsumption: 65, 
        socket: "AM4", category: "cpu", cores: 6, clockSpeed: 3.7 
      },
      { 
        id: "2", name: "AMD Ryzen 7 5700X", price: 25999, performance: 90, powerConsumption: 65, 
        socket: "AM4", category: "cpu", cores: 8, clockSpeed: 3.4 
      },
      { 
        id: "3", name: "Intel i5-12600KF", price: 22999, performance: 87, powerConsumption: 125, 
        socket: "LGA1700", category: "cpu", cores: 10, clockSpeed: 3.7 
      },
      { 
        id: "4", name: "Intel i7-12700KF", price: 32999, performance: 92, powerConsumption: 125, 
        socket: "LGA1700", category: "cpu", cores: 12, clockSpeed: 3.6 
      },
      { 
        id: "5", name: "AMD Ryzen 9 5900X", price: 42999, performance: 95, powerConsumption: 105, 
        socket: "AM4", category: "cpu", cores: 12, clockSpeed: 3.7 
      },
    ],
    gpu: [
      { 
        id: "1", name: "RTX 3060 12GB", price: 28999, performance: 75, powerConsumption: 170, 
        category: "gpu", vram: 12 
      },
      { 
        id: "2", name: "RTX 3060 Ti 8GB", price: 35999, performance: 80, powerConsumption: 200, 
        category: "gpu", vram: 8 
      },
      { 
        id: "3", name: "RTX 4060 Ti 16GB", price: 42999, performance: 85, powerConsumption: 165, 
        category: "gpu", vram: 16 
      },
      { 
        id: "4", name: "RTX 4070 12GB", price: 52999, performance: 88, powerConsumption: 200, 
        category: "gpu", vram: 12 
      },
      { 
        id: "5", name: "RTX 4070 Ti Super", price: 68999, performance: 92, powerConsumption: 285, 
        category: "gpu", vram: 16 
      },
    ],
    ram: [
      { 
        id: "1", name: "16GB DDR4-3200", price: 4999, performance: 70, powerConsumption: 10, 
        memoryType: "DDR4", category: "ram", capacity: 16, speed: 3200 
      },
      { 
        id: "2", name: "32GB DDR4-3600", price: 8999, performance: 80, powerConsumption: 15, 
        memoryType: "DDR4", category: "ram", capacity: 32, speed: 3600 
      },
      { 
        id: "3", name: "16GB DDR5-5600", price: 7999, performance: 85, powerConsumption: 12, 
        memoryType: "DDR5", category: "ram", capacity: 16, speed: 5600 
      },
      { 
        id: "4", name: "32GB DDR5-5600", price: 14999, performance: 90, powerConsumption: 18, 
        memoryType: "DDR5", category: "ram", capacity: 32, speed: 5600 
      },
      { 
        id: "5", name: "64GB DDR5-6000", price: 28999, performance: 95, powerConsumption: 25, 
        memoryType: "DDR5", category: "ram", capacity: 64, speed: 6000 
      },
    ],
    storage: [
      { 
        id: "1", name: "500GB NVMe SSD", price: 4299, performance: 75, powerConsumption: 5, 
        category: "storage", capacity: 500 
      },
      { 
        id: "2", name: "1TB NVMe SSD", price: 7499, performance: 80, powerConsumption: 6, 
        category: "storage", capacity: 1000 
      },
      { 
        id: "3", name: "2TB NVMe SSD", price: 14999, performance: 85, powerConsumption: 7, 
        category: "storage", capacity: 2000 
      },
      { 
        id: "4", name: "1TB NVMe Gen4", price: 9999, performance: 90, powerConsumption: 8, 
        category: "storage", capacity: 1000 
      },
      { 
        id: "5", name: "2TB NVMe Gen4", price: 18999, performance: 95, powerConsumption: 9, 
        category: "storage", capacity: 2000 
      },
    ],
    motherboard: [
      { 
        id: "1", name: "B450M Pro4", price: 5999, performance: 70, powerConsumption: 15, 
        socket: "AM4", memoryType: "DDR4", formFactor: "mATX", category: "motherboard" 
      },
      { 
        id: "2", name: "B550 Gaming", price: 8999, performance: 80, powerConsumption: 18, 
        socket: "AM4", memoryType: "DDR4", formFactor: "ATX", category: "motherboard" 
      },
      { 
        id: "3", name: "X570 Gaming", price: 12999, performance: 85, powerConsumption: 25, 
        socket: "AM4", memoryType: "DDR4", formFactor: "ATX", category: "motherboard" 
      },
      { 
        id: "4", name: "B650 Gaming WiFi", price: 15999, performance: 88, powerConsumption: 20, 
        socket: "AM5", memoryType: "DDR5", formFactor: "ATX", category: "motherboard" 
      },
      { 
        id: "5", name: "Z790 Gaming", price: 18999, performance: 90, powerConsumption: 22, 
        socket: "LGA1700", memoryType: "DDR5", formFactor: "ATX", category: "motherboard" 
      },
      { 
        id: "6", name: "X670E Gaming", price: 25999, performance: 95, powerConsumption: 28, 
        socket: "AM5", memoryType: "DDR5", formFactor: "ATX", category: "motherboard" 
      },
    ],
    psu: [
      { 
        id: "1", name: "550W 80+ Bronze", price: 3999, performance: 70, powerConsumption: 0, 
        category: "psu", wattage: 550 
      },
      { 
        id: "2", name: "650W 80+ Gold", price: 6999, performance: 80, powerConsumption: 0, 
        category: "psu", wattage: 650 
      },
      { 
        id: "3", name: "750W 80+ Gold", price: 8999, performance: 85, powerConsumption: 0, 
        category: "psu", wattage: 750 
      },
      { 
        id: "4", name: "850W 80+ Gold", price: 12999, performance: 90, powerConsumption: 0, 
        category: "psu", wattage: 850 
      },
      { 
        id: "5", name: "1000W 80+ Platinum", price: 18999, performance: 95, powerConsumption: 0, 
        category: "psu", wattage: 1000 
      },
    ],
    case: [
      { 
        id: "1", name: "Mid Tower Basic", price: 2999, performance: 70, powerConsumption: 0, 
        formFactor: "ATX", category: "case" 
      },
      { 
        id: "2", name: "Mid Tower RGB", price: 4999, performance: 75, powerConsumption: 5, 
        formFactor: "ATX", category: "case" 
      },
      { 
        id: "3", name: "Full Tower Gaming", price: 7999, performance: 85, powerConsumption: 10, 
        formFactor: "ATX", category: "case" 
      },
      { 
        id: "4", name: "Premium RGB Tower", price: 12999, performance: 90, powerConsumption: 15, 
        formFactor: "ATX", category: "case" 
      },
      { 
        id: "5", name: "Custom Loop Ready", price: 18999, performance: 95, powerConsumption: 20, 
        formFactor: "ATX", category: "case" 
      },
    ],
    cooler: [
      { 
        id: "1", name: "Stock Cooler", price: 0, performance: 60, powerConsumption: 5, 
        category: "cooler" 
      },
      { 
        id: "2", name: "Tower Air Cooler", price: 2999, performance: 75, powerConsumption: 8, 
        category: "cooler" 
      },
      { 
        id: "3", name: "High-End Air Cooler", price: 5999, performance: 85, powerConsumption: 10, 
        category: "cooler" 
      },
      { 
        id: "4", name: "240mm AIO", price: 8999, performance: 90, powerConsumption: 15, 
        category: "cooler" 
      },
      { 
        id: "5", name: "360mm AIO", price: 15999, performance: 95, powerConsumption: 20, 
        category: "cooler" 
      },
    ],
  };

  // Enhanced compatibility checking
  const checkCompatibility = useMemo((): CompatibilityCheck => {
    const issues: Array<{type: 'error' | 'warning' | 'info', message: string}> = [];
    let compatibilityScore = 100;

    // CPU-Motherboard compatibility
    if (config.cpu && config.motherboard) {
      if (config.cpu.socket !== config.motherboard.socket) {
        issues.push({
          type: "error",
          message: `CPU socket (${config.cpu.socket}) incompatible with motherboard socket (${config.motherboard.socket})`
        });
        compatibilityScore -= 30;
      }
    }

    // RAM-Motherboard compatibility
    if (config.ram && config.motherboard) {
      if (config.ram.memoryType !== config.motherboard.memoryType) {
        issues.push({
          type: "error",
          message: `RAM type (${config.ram.memoryType}) incompatible with motherboard (${config.motherboard.memoryType})`
        });
        compatibilityScore -= 25;
      }
    }

    // Power supply validation
    const totalPower = Object.values(config).reduce((sum, component) => 
      sum + (component?.powerConsumption || 0), 0
    );
    
    if (config.psu) {
      const psuWattage = config.psu.wattage || 0;
      const recommendedWattage = totalPower * 1.3;
      
      if (psuWattage < totalPower) {
        issues.push({
          type: "error",
          message: `PSU (${psuWattage}W) insufficient for system power draw (${totalPower}W)`
        });
        compatibilityScore -= 40;
      } else if (psuWattage < recommendedWattage) {
        issues.push({
          type: "warning",
          message: `PSU has minimal headroom. Recommend ${Math.ceil(recommendedWattage)}W+ for optimal efficiency`
        });
        compatibilityScore -= 10;
      }
    }

    // Performance bottleneck detection
    if (config.cpu && config.gpu) {
      const cpuPerf = config.cpu.performance;
      const gpuPerf = config.gpu.performance;
      const perfDiff = Math.abs(cpuPerf - gpuPerf);
      
      if (perfDiff > 20) {
        if (cpuPerf > gpuPerf) {
          issues.push({
            type: "warning",
            message: `CPU significantly outperforms GPU - consider upgrading GPU for balanced performance`
          });
        } else {
          issues.push({
            type: "warning",
            message: `GPU significantly outperforms CPU - potential CPU bottleneck in demanding games`
          });
        }
        compatibilityScore -= 10;
      }
    }

    // Case size validation
    if (config.case && config.motherboard) {
      if (config.motherboard.formFactor === "ATX" && config.case.formFactor === "mATX") {
        issues.push({
          type: "error",
          message: "ATX motherboard won't fit in Micro ATX case"
        });
        compatibilityScore -= 20;
      }
    }

    // RAM capacity recommendations
    if (config.ram && config.gpu) {
      const ramCapacity = config.ram.capacity || 0;
      const gpuVram = config.gpu.vram || 0;
      
      if (ramCapacity < 16 && gpuVram >= 12) {
        issues.push({
          type: "warning",
          message: "High-end GPU with less than 16GB RAM may cause performance issues"
        });
        compatibilityScore -= 5;
      }
    }

    // Cooling adequacy
    if (config.cpu && config.cooler) {
      const cpuTDP = config.cpu.powerConsumption;
      const coolerPerf = config.cooler.performance;
      
      if (cpuTDP > 100 && coolerPerf < 80) {
        issues.push({
          type: "warning",
          message: "High-TDP CPU may require better cooling solution"
        });
        compatibilityScore -= 5;
      }
    }

    return {
      issues,
      overallCompatible: issues.filter(i => i.type === 'error').length === 0,
      compatibilityScore: Math.max(0, compatibilityScore)
    };
  }, [config]);

  // Enhanced performance prediction
  const performancePrediction = useMemo((): PerformancePrediction | null => {
    if (!config.cpu || !config.gpu) return null;

    const cpuScore = config.cpu.performance;
    const gpuScore = config.gpu.performance;
    const ramScore = config.ram?.performance || 70;
    const storageScore = config.storage?.performance || 75;

    // Gaming performance calculation
    const gamingScore = Math.min(
      cpuScore * 0.25 + gpuScore * 0.6 + ramScore * 0.1 + storageScore * 0.05,
      100
    );

    // Productivity performance calculation
    const productivityScore = Math.min(
      cpuScore * 0.5 + gpuScore * 0.2 + ramScore * 0.2 + storageScore * 0.1,
      100
    );

    // FPS predictions for different scenarios
    const fps = {
      "1080p Ultra": Math.round((gamingScore / 100) * 120),
      "1080p High": Math.round((gamingScore / 100) * 140),
      "1440p Ultra": Math.round((gamingScore / 100) * 80),
      "1440p High": Math.round((gamingScore / 100) * 100),
      "4K High": Math.round((gamingScore / 100) * 45),
      "VR Gaming": Math.round((gamingScore / 100) * 90)
    };

    // Thermal and noise calculations
    const totalTDP = Object.values(config).reduce((sum, component) => 
      sum + (component?.powerConsumption || 0), 0
    );
    
    let thermalRating: 'Excellent' | 'Good' | 'Fair' | 'Poor' = 'Poor';
    let noiseLevel: 'Silent' | 'Quiet' | 'Moderate' | 'Loud' = 'Loud';
    
    const coolerPerf = config.cooler?.performance || 60;
    const caseAirflow = config.case?.performance || 70;
    
    const thermalScore = (coolerPerf + caseAirflow) / 2;
    
    if (thermalScore >= 85) {
      thermalRating = 'Excellent';
      noiseLevel = totalTDP > 200 ? 'Quiet' : 'Silent';
    } else if (thermalScore >= 75) {
      thermalRating = 'Good';
      noiseLevel = totalTDP > 250 ? 'Moderate' : 'Quiet';
    } else if (thermalScore >= 65) {
      thermalRating = 'Fair';
      noiseLevel = 'Moderate';
    }

    // Future-proofing score
    const avgPerformance = (gamingScore + productivityScore) / 2;
    const futureProofing = Math.min(100, avgPerformance + (config.ram?.capacity || 16) / 64 * 20);

    return {
      gamingScore: Math.round(gamingScore),
      productivityScore: Math.round(productivityScore),
      fps,
      thermalRating,
      noiseLevel,
      futureProofing: Math.round(futureProofing)
    };
  }, [config]);

  // Auto-optimization function
  const optimizeForBudget = () => {
    // Implementation for auto-optimization based on budget and use case
    // TODO: Implement automatic component optimization based on budget constraints
  };

  // Export functionality
  const handleExportList = () => {
    const selectedComponents = Object.entries(config)
      .filter(([_, component]) => component !== null)
      .map(([type, component]) => ({
        category: type,
        name: component!.name,
        price: component!.price,
        performance: component!.performance
      }));

    const exportData = {
      buildName: `Custom ${useCase} Build`,
      totalPrice,
      totalPower,
      budget,
      useCase,
      components: selectedComponents,
      compatibility: checkCompatibility,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pc-build-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Share functionality
  const handleShareBuild = async () => {
    const selectedComponents = Object.entries(config)
      .filter(([_, component]) => component !== null)
      .map(([type, component]) => `${type}: ${component!.name} (${formatPrice(component!.price)})`)
      .join('\n');

    const shareText = `Check out my custom PC build:
${selectedComponents}

Total Price: ${formatPrice(totalPrice)}
Budget: ${formatPrice(budget)}
Use Case: ${useCase}

Built with FusionForge PC Configurator`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Custom PC Build',
          text: shareText,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Build details copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy to clipboard');
      }
    }
  };

  const totalPrice = Object.values(config).reduce((total, component) => {
    return total + (component?.price || 0);
  }, 0);

  const totalPower = Object.values(config).reduce((total, component) => {
    return total + (component?.powerConsumption || 0);
  }, 0);

  const isOverBudget = totalPrice > budget;
  const budgetUsage = (totalPrice / budget) * 100;

  return (
    <div className="space-y-6">
      {/* Configuration Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Build Configuration
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Auto-Optimize</label>
                <Switch checked={autoOptimize} onCheckedChange={setAutoOptimize} />
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                Advanced Settings
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Budget: ₹{budget.toLocaleString()}</label>
              <Slider
                value={[budget]}
                onValueChange={(value) => setBudget(value[0])}
                min={30000}
                max={500000}
                step={10000}
                className="w-full"
              />
            </div>
            
            <Select value={useCase} onValueChange={setUseCase}>
              <SelectTrigger>
                <SelectValue placeholder="Primary Use Case" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gaming">Gaming</SelectItem>
                <SelectItem value="content-creation">Content Creation</SelectItem>
                <SelectItem value="workstation">Workstation</SelectItem>
                <SelectItem value="office">Office Work</SelectItem>
                <SelectItem value="ai-ml">AI/ML Development</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button 
                onClick={optimizeForBudget}
                disabled={!autoOptimize}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Optimize Build
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Component Selection */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(components).map(([componentType, componentList]) => (
            <Card key={componentType}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 capitalize">
                  {componentType === 'cpu' && <Cpu className="h-5 w-5" />}
                  {componentType === 'gpu' && <Monitor className="h-5 w-5" />}
                  {componentType === 'ram' && <MemoryStick className="h-5 w-5" />}
                  {componentType === 'storage' && <HardDrive className="h-5 w-5" />}
                  {componentType === 'psu' && <Zap className="h-5 w-5" />}
                  {componentType === 'motherboard' && <Settings className="h-5 w-5" />}
                  {componentType === 'case' && <Monitor className="h-5 w-5" />}
                  {componentType === 'cooler' && <Thermometer className="h-5 w-5" />}
                  {componentType.replace('_', ' ')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {componentList.map((component) => {
                    const isSelected = config[componentType as keyof BuildConfig]?.id === component.id;
                    const isAffordable = totalPrice - (config[componentType as keyof BuildConfig]?.price || 0) + component.price <= budget;
                    
                    return (
                      <div
                        key={component.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : isAffordable 
                              ? 'border-gray-200 hover:border-gray-300' 
                              : 'border-red-200 bg-red-50 opacity-60'
                        }`}
                        onClick={() => {
                          if (isAffordable || isSelected) {
                            setConfig(prev => ({
                              ...prev,
                              [componentType]: isSelected ? null : component
                            }));
                          }
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{component.name}</h4>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                              <span>Performance: {component.performance}/100</span>
                              <span>Power: {component.powerConsumption}W</span>
                              {(component as any).cores && <span>Cores: {(component as any).cores}</span>}
                              {(component as any).vram && <span>VRAM: {(component as any).vram}GB</span>}
                              {(component as any).capacity && <span>Size: {(component as any).capacity}GB</span>}
                              {(component as any).wattage && <span>Wattage: {(component as any).wattage}W</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-sm">
                              {component.price === 0 ? 'Included' : formatPrice(component.price)}
                            </div>
                            {!isAffordable && !isSelected && (
                              <Badge variant="destructive" className="text-xs mt-1">Over Budget</Badge>
                            )}
                            {isSelected && (
                              <Badge className="text-xs mt-1">Selected</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary and Analysis */}
        <div className="space-y-6">
          {/* Budget Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Total Cost</span>
                    <span className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                  <Progress value={Math.min(budgetUsage, 100)} className="h-2" />
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>Budget: {formatPrice(budget)}</span>
                    <span>{budgetUsage.toFixed(1)}% used</span>
                  </div>
                </div>

                {isOverBudget && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700 text-sm">
                      Build exceeds budget by {formatPrice(totalPrice - budget)}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Compatibility Check */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Compatibility ({checkCompatibility.compatibilityScore}/100)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Progress value={checkCompatibility.compatibilityScore} className="h-2" />
                
                {checkCompatibility.issues.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">All components are compatible</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {checkCompatibility.issues.map((issue, index) => (
                      <Alert key={index} className={
                        issue.type === 'error' ? 'border-red-200 bg-red-50' :
                        issue.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                        'border-blue-200 bg-blue-50'
                      }>
                        {issue.type === 'error' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                        {issue.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                        {issue.type === 'info' && <Info className="h-4 w-4 text-blue-600" />}
                        <AlertDescription className={`text-sm ${
                          issue.type === 'error' ? 'text-red-700' :
                          issue.type === 'warning' ? 'text-yellow-700' :
                          'text-blue-700'
                        }`}>
                          {issue.message}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Prediction */}
          {performancePrediction && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5" />
                  Performance Prediction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Gaming</span>
                        <span className="text-sm font-medium">{performancePrediction.gamingScore}/100</span>
                      </div>
                      <Progress value={performancePrediction.gamingScore} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Productivity</span>
                        <span className="text-sm font-medium">{performancePrediction.productivityScore}/100</span>
                      </div>
                      <Progress value={performancePrediction.productivityScore} className="h-2" />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-2">Expected FPS</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(performancePrediction.fps).map(([setting, fps]) => (
                        <div key={setting} className="flex justify-between">
                          <span className="text-gray-600">{setting}:</span>
                          <span className="font-medium">{fps} FPS</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Thermal Rating:</span>
                      <div className={`font-medium ${
                        performancePrediction.thermalRating === 'Excellent' ? 'text-green-600' :
                        performancePrediction.thermalRating === 'Good' ? 'text-blue-600' :
                        performancePrediction.thermalRating === 'Fair' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {performancePrediction.thermalRating}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Noise Level:</span>
                      <div className="font-medium">{performancePrediction.noiseLevel}</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Future-Proofing</span>
                      <span className="text-sm font-medium">{performancePrediction.futureProofing}/100</span>
                    </div>
                    <Progress value={performancePrediction.futureProofing} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Power Draw:</span>
                  <span className="font-medium">{totalPower}W</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recommended PSU:</span>
                  <span className="font-medium">{Math.ceil(totalPower * 1.3)}W+</span>
                </div>
                {config.ram && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total RAM:</span>
                    <span className="font-medium">{config.ram.capacity || 16}GB {config.ram.memoryType || 'DDR4'}</span>
                  </div>
                )}
                {config.storage && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Primary Storage:</span>
                    <span className="font-medium">{config.storage.capacity || 500}GB SSD</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              className="w-full bg-gradient-to-r from-tech-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg" 
              disabled={!checkCompatibility.overallCompatible || isOverBudget}
            >
              <Settings className="mr-2 h-4 w-4" />
              Save Configuration
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportList}
                className="border-2 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 group"
                disabled={totalPrice === 0}
              >
                <Download className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                Export List
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleShareBuild}
                className="border-2 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 group"
                disabled={totalPrice === 0}
              >
                <Share2 className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                Share Build
              </Button>
            </div>
            <Link href="/contact">
              <Button 
                variant="outline" 
                className="w-full border-2 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 group" 
                size="sm"
                disabled={totalPrice === 0}
              >
                <MessageCircle className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                Request Custom Quote
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}