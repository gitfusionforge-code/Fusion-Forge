import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Cpu, HardDrive, MemoryStick, Zap, Monitor, Gamepad2, AlertTriangle, CheckCircle, Info } from "lucide-react";
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
}

interface BuildConfig {
  cpu: Component | null;
  gpu: Component | null;
  ram: Component | null;
  storage: Component | null;
  motherboard: Component | null;
  psu: Component | null;
  case: Component | null;
}

export default function BuildConfigurator() {
  const [budget, setBudget] = useState<string>("100000");
  const [useCase, setUseCase] = useState<string>("gaming");
  const [config, setConfig] = useState<BuildConfig>({
    cpu: null,
    gpu: null,
    ram: null,
    storage: null,
    motherboard: null,
    psu: null,
    case: null,
  });

  const components = {
    cpu: [
      { id: "1", name: "AMD Ryzen 5 5600X", price: 18999, performance: 85, powerConsumption: 65, socket: "AM4", category: "cpu" },
      { id: "2", name: "AMD Ryzen 7 5700X", price: 25999, performance: 90, powerConsumption: 65, socket: "AM4", category: "cpu" },
      { id: "3", name: "Intel i5-12600KF", price: 22999, performance: 87, powerConsumption: 125, socket: "LGA1700", category: "cpu" },
      { id: "4", name: "Intel i7-12700KF", price: 32999, performance: 92, powerConsumption: 125, socket: "LGA1700", category: "cpu" },
      { id: "5", name: "AMD Ryzen 9 5900X", price: 42999, performance: 95, powerConsumption: 105, socket: "AM4", category: "cpu" },
    ],
    gpu: [
      { id: "1", name: "RTX 3060 12GB", price: 28999, performance: 75, powerConsumption: 170, category: "gpu" },
      { id: "2", name: "RTX 3060 Ti 8GB", price: 35999, performance: 80, powerConsumption: 200, category: "gpu" },
      { id: "3", name: "RTX 4060 Ti 16GB", price: 42999, performance: 85, powerConsumption: 165, category: "gpu" },
      { id: "4", name: "RTX 4070 12GB", price: 52999, performance: 88, powerConsumption: 200, category: "gpu" },
      { id: "5", name: "RTX 4070 Ti Super", price: 68999, performance: 92, powerConsumption: 285, category: "gpu" },
    ],
    ram: [
      { id: "1", name: "16GB DDR4-3200", price: 4999, performance: 70, powerConsumption: 10, memoryType: "DDR4", category: "ram" },
      { id: "2", name: "32GB DDR4-3600", price: 8999, performance: 80, powerConsumption: 15, memoryType: "DDR4", category: "ram" },
      { id: "3", name: "16GB DDR5-5600", price: 7999, performance: 85, powerConsumption: 12, memoryType: "DDR5", category: "ram" },
      { id: "4", name: "32GB DDR5-5600", price: 14999, performance: 90, powerConsumption: 18, memoryType: "DDR5", category: "ram" },
      { id: "5", name: "64GB DDR5-6000", price: 28999, performance: 95, powerConsumption: 25, memoryType: "DDR5", category: "ram" },
    ],
    storage: [
      { id: "1", name: "500GB NVMe SSD", price: 4299, performance: 75, powerConsumption: 5, category: "storage" },
      { id: "2", name: "1TB NVMe SSD", price: 7499, performance: 80, powerConsumption: 6, category: "storage" },
      { id: "3", name: "2TB NVMe SSD", price: 14999, performance: 85, powerConsumption: 7, category: "storage" },
      { id: "4", name: "1TB NVMe Gen4", price: 9999, performance: 90, powerConsumption: 8, category: "storage" },
      { id: "5", name: "2TB NVMe Gen4", price: 18999, performance: 95, powerConsumption: 9, category: "storage" },
    ],
    motherboard: [
      { id: "1", name: "B450M Pro4", price: 5999, performance: 70, powerConsumption: 15, socket: "AM4", memoryType: "DDR4", formFactor: "mATX", category: "motherboard" },
      { id: "2", name: "B550 Gaming", price: 8999, performance: 80, powerConsumption: 18, socket: "AM4", memoryType: "DDR4", formFactor: "ATX", category: "motherboard" },
      { id: "3", name: "X570 Gaming", price: 12999, performance: 85, powerConsumption: 25, socket: "AM4", memoryType: "DDR4", formFactor: "ATX", category: "motherboard" },
      { id: "4", name: "B650 Gaming WiFi", price: 15999, performance: 88, powerConsumption: 20, socket: "AM5", memoryType: "DDR5", formFactor: "ATX", category: "motherboard" },
      { id: "5", name: "Z790 Gaming", price: 18999, performance: 90, powerConsumption: 22, socket: "LGA1700", memoryType: "DDR5", formFactor: "ATX", category: "motherboard" },
      { id: "6", name: "X670E Gaming", price: 25999, performance: 95, powerConsumption: 28, socket: "AM5", memoryType: "DDR5", formFactor: "ATX", category: "motherboard" },
    ],
    psu: [
      { id: "1", name: "550W 80+ Bronze", price: 3999, performance: 70, powerConsumption: 0, category: "psu" },
      { id: "2", name: "650W 80+ Gold", price: 6999, performance: 80, powerConsumption: 0, category: "psu" },
      { id: "3", name: "750W 80+ Gold", price: 8999, performance: 85, powerConsumption: 0, category: "psu" },
      { id: "4", name: "850W 80+ Gold", price: 12999, performance: 90, powerConsumption: 0, category: "psu" },
      { id: "5", name: "1000W 80+ Platinum", price: 18999, performance: 95, powerConsumption: 0, category: "psu" },
    ],
    case: [
      { id: "1", name: "Mid Tower Basic", price: 2999, performance: 70, powerConsumption: 0, formFactor: "ATX", category: "case" },
      { id: "2", name: "Mid Tower RGB", price: 4999, performance: 75, powerConsumption: 5, formFactor: "ATX", category: "case" },
      { id: "3", name: "Full Tower Gaming", price: 7999, performance: 85, powerConsumption: 10, formFactor: "ATX", category: "case" },
      { id: "4", name: "Premium RGB Tower", price: 12999, performance: 90, powerConsumption: 15, formFactor: "ATX", category: "case" },
      { id: "5", name: "Custom Loop Ready", price: 18999, performance: 95, powerConsumption: 20, formFactor: "ATX", category: "case" },
    ],
  };

  // Compatibility and validation functions
  const checkCompatibility = () => {
    const issues = [];
    
    // CPU-Motherboard socket compatibility
    if (config.cpu && config.motherboard) {
      if (config.cpu.socket !== config.motherboard.socket) {
        issues.push({
          type: "error",
          message: `CPU socket ${config.cpu.socket} is not compatible with motherboard socket ${config.motherboard.socket}`
        });
      }
    }
    
    // RAM-Motherboard memory type compatibility
    if (config.ram && config.motherboard) {
      if (config.ram.memoryType !== config.motherboard.memoryType) {
        issues.push({
          type: "error",
          message: `${config.ram.memoryType} RAM is not compatible with ${config.motherboard.memoryType} motherboard`
        });
      }
    }
    
    return issues;
  };

  const calculatePowerConsumption = () => {
    const totalPower = Object.values(config).reduce((sum, component) => 
      sum + (component?.powerConsumption || 0), 0
    );
    
    const recommendedPSU = totalPower * 1.3; // 30% headroom
    const issues = [];
    
    if (config.psu) {
      const psuWattage = parseInt(config.psu.name.match(/(\d+)W/)?.[1] || "0");
      if (psuWattage < recommendedPSU) {
        issues.push({
          type: "warning",
          message: `PSU may be underpowered. System needs ~${Math.ceil(recommendedPSU)}W, but PSU provides ${psuWattage}W`
        });
      }
    }
    
    return { totalPower, recommendedPSU, issues };
  };

  const detectBottlenecks = () => {
    const issues = [];
    
    if (config.cpu && config.gpu) {
      const performanceDiff = Math.abs(config.cpu.performance - config.gpu.performance);
      
      if (performanceDiff > 20) {
        if (config.cpu.performance < config.gpu.performance) {
          issues.push({
            type: "warning",
            message: "CPU may bottleneck GPU performance. Consider upgrading CPU for better balance."
          });
        } else {
          issues.push({
            type: "info",
            message: "GPU may limit CPU potential. Consider upgrading GPU for better gaming performance."
          });
        }
      }
    }
    
    // RAM capacity warnings
    if (config.ram && config.gpu) {
      const ramSize = parseInt(config.ram.name.match(/(\d+)GB/)?.[1] || "0");
      if (ramSize < 16 && config.gpu.performance > 80) {
        issues.push({
          type: "warning",
          message: "High-end GPU with less than 16GB RAM may cause performance issues in modern games."
        });
      }
    }
    
    return issues;
  };

  const predictPerformance = () => {
    if (!config.cpu || !config.gpu) return null;
    
    const cpuWeight = 0.3;
    const gpuWeight = 0.5;
    const ramWeight = 0.1;
    const storageWeight = 0.1;
    
    const performanceScore = 
      (config.cpu.performance * cpuWeight) +
      (config.gpu.performance * gpuWeight) +
      ((config.ram?.performance || 70) * ramWeight) +
      ((config.storage?.performance || 70) * storageWeight);
    
    let gamePerformance = "";
    if (performanceScore >= 90) gamePerformance = "4K Ultra Settings (60+ FPS)";
    else if (performanceScore >= 85) gamePerformance = "1440p Ultra Settings (60+ FPS)";
    else if (performanceScore >= 80) gamePerformance = "1440p High Settings (60+ FPS)";
    else if (performanceScore >= 75) gamePerformance = "1080p Ultra Settings (60+ FPS)";
    else if (performanceScore >= 70) gamePerformance = "1080p High Settings (60+ FPS)";
    else gamePerformance = "1080p Medium Settings (30-60 FPS)";
    
    return { score: Math.round(performanceScore), gamePerformance };
  };

  const compatibility = checkCompatibility();
  const powerAnalysis = calculatePowerConsumption();
  const bottlenecks = detectBottlenecks();
  const performance = predictPerformance();
  const allIssues = [...compatibility, ...powerAnalysis.issues, ...bottlenecks];

  const totalPrice = Object.values(config).reduce((sum, component) => 
    sum + (component?.price || 0), 0
  );

  const updateComponent = (type: keyof BuildConfig, componentId: string) => {
    const component = components[type].find(c => c.id === componentId);
    if (component) {
      setConfig(prev => ({ ...prev, [type]: component }));
    }
  };

  const getRecommendations = () => {
    const budgetNum = parseInt(budget);
    const recommendations: Partial<BuildConfig> = {};

    if (useCase === "gaming") {
      // Prioritize GPU for gaming
      if (budgetNum <= 50000) {
        recommendations.gpu = components.gpu[0]; // RTX 3060
        recommendations.cpu = components.cpu[0]; // Ryzen 5 5600X
      } else if (budgetNum <= 100000) {
        recommendations.gpu = components.gpu[2]; // RTX 4060 Ti
        recommendations.cpu = components.cpu[1]; // Ryzen 7 5700X
      } else {
        recommendations.gpu = components.gpu[4]; // RTX 4070 Ti Super
        recommendations.cpu = components.cpu[4]; // Ryzen 9 5900X
      }
    } else if (useCase === "workstation") {
      // Prioritize CPU and RAM for workstation
      if (budgetNum <= 50000) {
        recommendations.cpu = components.cpu[1]; // Ryzen 7 5700X
        recommendations.ram = components.ram[1]; // 32GB DDR4
      } else if (budgetNum <= 100000) {
        recommendations.cpu = components.cpu[4]; // Ryzen 9 5900X
        recommendations.ram = components.ram[3]; // 32GB DDR5
      } else {
        recommendations.cpu = components.cpu[4]; // Ryzen 9 5900X
        recommendations.ram = components.ram[4]; // 64GB DDR5
      }
    }

    setConfig(prev => ({ ...prev, ...recommendations }));
  };

  const componentIcons = {
    cpu: Cpu,
    gpu: Monitor,
    ram: MemoryStick,
    storage: HardDrive,
    motherboard: Gamepad2,
    psu: Zap,
    case: HardDrive,
  };

  const componentLabels = {
    cpu: "Processor",
    gpu: "Graphics Card",
    ram: "Memory (RAM)",
    storage: "Storage (SSD)",
    motherboard: "Motherboard",
    psu: "Power Supply",
    case: "PC Case",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-deep-blue">
            PC Build Configurator
          </CardTitle>
          <p className="text-gray-600">
            Build your custom PC by selecting components that match your budget and use case
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Budget Range</label>
              <Select value={budget} onValueChange={setBudget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50000">Under ₹50,000</SelectItem>
                  <SelectItem value="100000">₹50,000 - ₹1,00,000</SelectItem>
                  <SelectItem value="200000">₹1,00,000 - ₹2,00,000</SelectItem>
                  <SelectItem value="300000">Above ₹2,00,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Primary Use</label>
              <Select value={useCase} onValueChange={setUseCase}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gaming">Gaming</SelectItem>
                  <SelectItem value="workstation">Workstation</SelectItem>
                  <SelectItem value="content">Content Creation</SelectItem>
                  <SelectItem value="office">Office Work</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={getRecommendations} 
                className="w-full bg-gradient-to-r from-tech-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                <Gamepad2 className="mr-2 h-4 w-4" />
                Get Smart Recommendations
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Components</h3>
              
              {Object.entries(componentLabels).map(([type, label]) => {
                const Icon = componentIcons[type as keyof typeof componentIcons];
                const selectedComponent = config[type as keyof BuildConfig];
                
                return (
                  <div key={type} className="space-y-3">
                    <label className="flex items-center gap-2 text-base font-semibold text-gray-800">
                      <Icon className="h-5 w-5 text-tech-orange" />
                      {label}
                      {selectedComponent && (
                        <Badge className="ml-2 bg-green-100 text-green-800 border-green-300">
                          Selected
                        </Badge>
                      )}
                    </label>
                    <div className="space-y-3 max-h-64 overflow-y-auto border rounded-lg p-3">
                      {components[type as keyof typeof components].map((component) => {
                        const isSelected = selectedComponent?.id === component.id;
                        return (
                          <div
                            key={component.id}
                            onClick={() => updateComponent(type as keyof BuildConfig, component.id)}
                            className={`
                              relative p-4 border-2 rounded-xl cursor-pointer 
                              transition-all duration-300 ease-in-out
                              transform hover:scale-102 active:scale-98
                              group overflow-hidden
                              ${isSelected 
                                ? 'border-tech-orange bg-gradient-to-r from-orange-50 to-orange-100 ring-2 ring-orange-200 shadow-lg' 
                                : 'border-gray-200 hover:border-orange-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-orange-50 hover:shadow-md'
                              }
                            `}
                          >
                            {/* Selection indicator */}
                            {isSelected && (
                              <div className="absolute top-3 right-3">
                                <CheckCircle className="h-5 w-5 text-tech-orange animate-bounce" />
                              </div>
                            )}
                            
                            {/* Hover glow effect */}
                            <div className={`
                              absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 
                              transition-opacity duration-300 pointer-events-none
                              ${isSelected ? 'bg-orange-400' : 'bg-orange-300'}
                            `}></div>
                            
                            <div className="relative flex justify-between items-center">
                              <div className="flex-1 pr-6">
                                <h4 className={`font-semibold text-sm mb-2 ${
                                  isSelected ? 'text-orange-800' : 'text-gray-800 group-hover:text-orange-700'
                                }`}>
                                  {component.name}
                                </h4>
                                <div className="flex items-center gap-4 text-xs">
                                  <div className={`flex items-center gap-1 ${
                                    isSelected ? 'text-orange-600' : 'text-gray-500 group-hover:text-orange-600'
                                  }`}>
                                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                    <span>Performance: {component.performance}/100</span>
                                  </div>
                                  <div className={`flex items-center gap-1 ${
                                    isSelected ? 'text-orange-600' : 'text-gray-500 group-hover:text-orange-600'
                                  }`}>
                                    <Zap className="w-3 h-3" />
                                    <span>{component.powerConsumption}W</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`font-bold text-lg ${
                                  isSelected ? 'text-orange-700' : 'text-gray-700 group-hover:text-orange-600'
                                }`}>
                                  {formatPrice(component.price)}
                                </span>
                              </div>
                            </div>
                            
                            {/* Performance bar */}
                            <div className="mt-3">
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 ease-out rounded-full ${
                                    isSelected 
                                      ? 'bg-gradient-to-r from-orange-400 to-orange-600' 
                                      : 'bg-gradient-to-r from-gray-400 to-gray-500 group-hover:from-orange-300 group-hover:to-orange-500'
                                  }`}
                                  style={{ width: `${component.performance}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Build Analysis</h3>
              
              {/* Compatibility and Issue Alerts */}
              {allIssues.length > 0 && (
                <div className="space-y-2">
                  {allIssues.map((issue, index) => (
                    <Alert key={index} className={
                      issue.type === "error" ? "border-red-200 bg-red-50" :
                      issue.type === "warning" ? "border-yellow-200 bg-yellow-50" :
                      "border-blue-200 bg-blue-50"
                    }>
                      {issue.type === "error" ? <AlertTriangle className="h-4 w-4 text-red-600" /> :
                       issue.type === "warning" ? <AlertTriangle className="h-4 w-4 text-yellow-600" /> :
                       <Info className="h-4 w-4 text-blue-600" />}
                      <AlertDescription className={
                        issue.type === "error" ? "text-red-700" :
                        issue.type === "warning" ? "text-yellow-700" :
                        "text-blue-700"
                      }>
                        {issue.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Performance Prediction */}
              {performance && (
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Performance Prediction
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Overall Score:</span>
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                          {performance.score}/100
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Gaming Performance:</strong> {performance.gamePerformance}
                      </div>
                      <Progress value={performance.score} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Power Analysis */}
              <Card className="bg-gray-50 dark:bg-gray-800">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Power Analysis
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>System Power Draw:</span>
                      <span className="font-medium">{powerAnalysis.totalPower}W</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recommended PSU:</span>
                      <span className="font-medium">{Math.ceil(powerAnalysis.recommendedPSU)}W+</span>
                    </div>
                    {config.psu && (
                      <div className="flex justify-between">
                        <span>Selected PSU:</span>
                        <span className={`font-medium ${
                          parseInt(config.psu.name.match(/(\d+)W/)?.[1] || "0") >= powerAnalysis.recommendedPSU 
                            ? "text-green-600" : "text-red-600"
                        }`}>
                          {config.psu.name}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Build Summary */}
              <Card className="bg-white dark:bg-gray-900 border-2">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Price:</span>
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      {formatPrice(totalPrice)}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Selected Components:</h4>
                    {Object.entries(config).map(([type, component]) => 
                      component && (
                        <div key={type} className="flex justify-between text-sm">
                          <span className="text-gray-600">{componentLabels[type as keyof typeof componentLabels]}:</span>
                          <span className="font-medium">{formatPrice(component.price)}</span>
                        </div>
                      )
                    )}
                  </div>

                  <Link href="/contact">
                    <Button 
                      className="w-full mt-4" 
                      disabled={totalPrice === 0 || compatibility.some(issue => issue.type === "error")}
                    >
                      {compatibility.some(issue => issue.type === "error") 
                        ? "Fix Compatibility Issues First" 
                        : "Request Quote for This Build"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <div className="text-xs text-gray-500 space-y-1">
                <p>• Compatibility checked automatically</p>
                <p>• Power requirements calculated with 30% headroom</p>
                <p>• Performance predictions based on component synergy</p>
                <p>• Final quotes may vary based on availability</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}