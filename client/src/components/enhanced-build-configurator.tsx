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
  assessmentLevel?: string;
  hasErrors?: boolean;
  warningCount?: number;
  infoCount?: number;
  totalIssues?: number;
}

interface PerformancePrediction {
  gamingScore: number;
  productivityScore: number;
  fps: Record<string, number>;
  thermalRating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  noiseLevel: 'Silent' | 'Quiet' | 'Moderate' | 'Loud';
  futureProofing: number;
  bottleneckComponent?: string;
  recommendations?: string[];
  useCaseScore?: number;
  performanceCategory?: string;
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

  // Comprehensive component database with real market data
  const components = {
    cpu: [
      // Budget CPUs
      { 
        id: "1", name: "AMD Ryzen 5 4500", price: 8999, performance: 70, powerConsumption: 65, 
        socket: "AM4", category: "cpu", cores: 6, clockSpeed: 3.6, tier: "budget" 
      },
      { 
        id: "2", name: "Intel Core i3-12100F", price: 9999, performance: 72, powerConsumption: 60, 
        socket: "LGA1700", category: "cpu", cores: 4, clockSpeed: 3.3, tier: "budget" 
      },
      // Mid-range CPUs
      { 
        id: "3", name: "AMD Ryzen 5 5600X", price: 18999, performance: 85, powerConsumption: 65, 
        socket: "AM4", category: "cpu", cores: 6, clockSpeed: 3.7, tier: "mid-range" 
      },
      { 
        id: "4", name: "Intel Core i5-12600KF", price: 22999, performance: 87, powerConsumption: 125, 
        socket: "LGA1700", category: "cpu", cores: 10, clockSpeed: 3.7, tier: "mid-range" 
      },
      { 
        id: "5", name: "AMD Ryzen 7 5700X", price: 25999, performance: 90, powerConsumption: 65, 
        socket: "AM4", category: "cpu", cores: 8, clockSpeed: 3.4, tier: "mid-range" 
      },
      // High-end CPUs
      { 
        id: "6", name: "Intel Core i7-12700KF", price: 32999, performance: 92, powerConsumption: 125, 
        socket: "LGA1700", category: "cpu", cores: 12, clockSpeed: 3.6, tier: "high-end" 
      },
      { 
        id: "7", name: "AMD Ryzen 9 5900X", price: 42999, performance: 95, powerConsumption: 105, 
        socket: "AM4", category: "cpu", cores: 12, clockSpeed: 3.7, tier: "high-end" 
      },
      { 
        id: "8", name: "Intel Core i9-12900KF", price: 48999, performance: 98, powerConsumption: 125, 
        socket: "LGA1700", category: "cpu", cores: 16, clockSpeed: 3.2, tier: "enthusiast" 
      },
      { 
        id: "9", name: "AMD Ryzen 9 5950X", price: 58999, performance: 100, powerConsumption: 105, 
        socket: "AM4", category: "cpu", cores: 16, clockSpeed: 3.4, tier: "enthusiast" 
      },
    ],
    gpu: [
      // Budget GPUs
      { 
        id: "1", name: "GTX 1660 Super 6GB", price: 16999, performance: 65, powerConsumption: 125, 
        category: "gpu", vram: 6, tier: "budget" 
      },
      { 
        id: "2", name: "RTX 3050 8GB", price: 22999, performance: 68, powerConsumption: 130, 
        category: "gpu", vram: 8, tier: "budget" 
      },
      { 
        id: "3", name: "RTX 4060 8GB", price: 26999, performance: 72, powerConsumption: 115, 
        category: "gpu", vram: 8, tier: "budget" 
      },
      // Mid-range GPUs
      { 
        id: "4", name: "RTX 3060 12GB", price: 28999, performance: 75, powerConsumption: 170, 
        category: "gpu", vram: 12, tier: "mid-range" 
      },
      { 
        id: "5", name: "RTX 3060 Ti 8GB", price: 35999, performance: 80, powerConsumption: 200, 
        category: "gpu", vram: 8, tier: "mid-range" 
      },
      { 
        id: "6", name: "RTX 4060 Ti 16GB", price: 42999, performance: 85, powerConsumption: 165, 
        category: "gpu", vram: 16, tier: "mid-range" 
      },
      // High-end GPUs
      { 
        id: "7", name: "RTX 4070 12GB", price: 52999, performance: 88, powerConsumption: 200, 
        category: "gpu", vram: 12, tier: "high-end" 
      },
      { 
        id: "8", name: "RTX 4070 Ti Super 16GB", price: 68999, performance: 92, powerConsumption: 285, 
        category: "gpu", vram: 16, tier: "high-end" 
      },
      { 
        id: "9", name: "RTX 4080 16GB", price: 89999, performance: 95, powerConsumption: 320, 
        category: "gpu", vram: 16, tier: "enthusiast" 
      },
      { 
        id: "10", name: "RTX 4090 24GB", price: 159999, performance: 100, powerConsumption: 450, 
        category: "gpu", vram: 24, tier: "enthusiast" 
      },
    ],
    ram: [
      // Budget RAM
      { 
        id: "1", name: "8GB DDR4-2666", price: 2499, performance: 60, powerConsumption: 8, 
        memoryType: "DDR4", category: "ram", capacity: 8, speed: 2666, tier: "budget" 
      },
      { 
        id: "2", name: "16GB DDR4-3200", price: 4999, performance: 70, powerConsumption: 10, 
        memoryType: "DDR4", category: "ram", capacity: 16, speed: 3200, tier: "budget" 
      },
      // Mid-range RAM
      { 
        id: "3", name: "16GB DDR4-3600", price: 5999, performance: 75, powerConsumption: 11, 
        memoryType: "DDR4", category: "ram", capacity: 16, speed: 3600, tier: "mid-range" 
      },
      { 
        id: "4", name: "32GB DDR4-3600", price: 8999, performance: 80, powerConsumption: 15, 
        memoryType: "DDR4", category: "ram", capacity: 32, speed: 3600, tier: "mid-range" 
      },
      { 
        id: "5", name: "16GB DDR5-5600", price: 7999, performance: 85, powerConsumption: 12, 
        memoryType: "DDR5", category: "ram", capacity: 16, speed: 5600, tier: "mid-range" 
      },
      // High-end RAM
      { 
        id: "6", name: "32GB DDR5-5600", price: 14999, performance: 90, powerConsumption: 18, 
        memoryType: "DDR5", category: "ram", capacity: 32, speed: 5600, tier: "high-end" 
      },
      { 
        id: "7", name: "32GB DDR5-6000", price: 18999, performance: 92, powerConsumption: 20, 
        memoryType: "DDR5", category: "ram", capacity: 32, speed: 6000, tier: "high-end" 
      },
      { 
        id: "8", name: "64GB DDR5-6000", price: 28999, performance: 95, powerConsumption: 25, 
        memoryType: "DDR5", category: "ram", capacity: 64, speed: 6000, tier: "enthusiast" 
      },
      { 
        id: "9", name: "128GB DDR5-5600", price: 55999, performance: 100, powerConsumption: 35, 
        memoryType: "DDR5", category: "ram", capacity: 128, speed: 5600, tier: "enthusiast" 
      },
    ],
    storage: [
      // Budget Storage
      { 
        id: "1", name: "500GB SATA SSD", price: 3299, performance: 65, powerConsumption: 3, 
        category: "storage", capacity: 500, type: "SATA", tier: "budget" 
      },
      { 
        id: "2", name: "1TB HDD 7200RPM", price: 3999, performance: 50, powerConsumption: 8, 
        category: "storage", capacity: 1000, type: "HDD", tier: "budget" 
      },
      { 
        id: "3", name: "500GB NVMe Gen3", price: 4299, performance: 75, powerConsumption: 5, 
        category: "storage", capacity: 500, type: "NVMe Gen3", tier: "budget" 
      },
      // Mid-range Storage
      { 
        id: "4", name: "1TB NVMe Gen3", price: 7499, performance: 80, powerConsumption: 6, 
        category: "storage", capacity: 1000, type: "NVMe Gen3", tier: "mid-range" 
      },
      { 
        id: "5", name: "2TB SATA SSD", price: 12999, performance: 70, powerConsumption: 5, 
        category: "storage", capacity: 2000, type: "SATA", tier: "mid-range" 
      },
      { 
        id: "6", name: "1TB NVMe Gen4", price: 9999, performance: 90, powerConsumption: 8, 
        category: "storage", capacity: 1000, type: "NVMe Gen4", tier: "mid-range" 
      },
      // High-end Storage
      { 
        id: "7", name: "2TB NVMe Gen3", price: 14999, performance: 85, powerConsumption: 7, 
        category: "storage", capacity: 2000, type: "NVMe Gen3", tier: "high-end" 
      },
      { 
        id: "8", name: "2TB NVMe Gen4", price: 18999, performance: 95, powerConsumption: 9, 
        category: "storage", capacity: 2000, type: "NVMe Gen4", tier: "high-end" 
      },
      { 
        id: "9", name: "4TB NVMe Gen4", price: 35999, performance: 98, powerConsumption: 12, 
        category: "storage", capacity: 4000, type: "NVMe Gen4", tier: "enthusiast" 
      },
      { 
        id: "10", name: "8TB NVMe Gen4", price: 68999, performance: 100, powerConsumption: 15, 
        category: "storage", capacity: 8000, type: "NVMe Gen4", tier: "enthusiast" 
      },
    ],
    motherboard: [
      // Budget Motherboards
      { 
        id: "1", name: "A520M-K", price: 4999, performance: 65, powerConsumption: 12, 
        socket: "AM4", memoryType: "DDR4", formFactor: "mATX", category: "motherboard", tier: "budget" 
      },
      { 
        id: "2", name: "B450M Pro4", price: 5999, performance: 70, powerConsumption: 15, 
        socket: "AM4", memoryType: "DDR4", formFactor: "mATX", category: "motherboard", tier: "budget" 
      },
      { 
        id: "3", name: "H610M-K", price: 6999, performance: 68, powerConsumption: 14, 
        socket: "LGA1700", memoryType: "DDR4", formFactor: "mATX", category: "motherboard", tier: "budget" 
      },
      // Mid-range Motherboards
      { 
        id: "4", name: "B550 Gaming", price: 8999, performance: 80, powerConsumption: 18, 
        socket: "AM4", memoryType: "DDR4", formFactor: "ATX", category: "motherboard", tier: "mid-range" 
      },
      { 
        id: "5", name: "B660 Gaming WiFi", price: 11999, performance: 82, powerConsumption: 20, 
        socket: "LGA1700", memoryType: "DDR4", formFactor: "ATX", category: "motherboard", tier: "mid-range" 
      },
      { 
        id: "6", name: "X570 Gaming", price: 12999, performance: 85, powerConsumption: 25, 
        socket: "AM4", memoryType: "DDR4", formFactor: "ATX", category: "motherboard", tier: "mid-range" 
      },
      // High-end Motherboards
      { 
        id: "7", name: "B650 Gaming WiFi", price: 15999, performance: 88, powerConsumption: 20, 
        socket: "AM5", memoryType: "DDR5", formFactor: "ATX", category: "motherboard", tier: "high-end" 
      },
      { 
        id: "8", name: "Z790 Gaming", price: 18999, performance: 90, powerConsumption: 22, 
        socket: "LGA1700", memoryType: "DDR5", formFactor: "ATX", category: "motherboard", tier: "high-end" 
      },
      { 
        id: "9", name: "X670E Gaming", price: 25999, performance: 95, powerConsumption: 28, 
        socket: "AM5", memoryType: "DDR5", formFactor: "ATX", category: "motherboard", tier: "enthusiast" 
      },
      { 
        id: "10", name: "Z790 Extreme", price: 35999, performance: 98, powerConsumption: 32, 
        socket: "LGA1700", memoryType: "DDR5", formFactor: "ATX", category: "motherboard", tier: "enthusiast" 
      },
    ],
    psu: [
      // Budget PSUs
      { 
        id: "1", name: "450W 80+ White", price: 2999, performance: 60, powerConsumption: 0, 
        category: "psu", wattage: 450, efficiency: "80+", tier: "budget" 
      },
      { 
        id: "2", name: "550W 80+ Bronze", price: 3999, performance: 70, powerConsumption: 0, 
        category: "psu", wattage: 550, efficiency: "80+ Bronze", tier: "budget" 
      },
      { 
        id: "3", name: "650W 80+ Bronze", price: 4999, performance: 75, powerConsumption: 0, 
        category: "psu", wattage: 650, efficiency: "80+ Bronze", tier: "budget" 
      },
      // Mid-range PSUs
      { 
        id: "4", name: "650W 80+ Gold", price: 6999, performance: 80, powerConsumption: 0, 
        category: "psu", wattage: 650, efficiency: "80+ Gold", tier: "mid-range" 
      },
      { 
        id: "5", name: "750W 80+ Gold", price: 8999, performance: 85, powerConsumption: 0, 
        category: "psu", wattage: 750, efficiency: "80+ Gold", tier: "mid-range" 
      },
      { 
        id: "6", name: "850W 80+ Gold", price: 12999, performance: 90, powerConsumption: 0, 
        category: "psu", wattage: 850, efficiency: "80+ Gold", tier: "mid-range" 
      },
      // High-end PSUs
      { 
        id: "7", name: "1000W 80+ Gold", price: 16999, performance: 92, powerConsumption: 0, 
        category: "psu", wattage: 1000, efficiency: "80+ Gold", tier: "high-end" 
      },
      { 
        id: "8", name: "1000W 80+ Platinum", price: 18999, performance: 95, powerConsumption: 0, 
        category: "psu", wattage: 1000, efficiency: "80+ Platinum", tier: "high-end" 
      },
      { 
        id: "9", name: "1200W 80+ Titanium", price: 28999, performance: 98, powerConsumption: 0, 
        category: "psu", wattage: 1200, efficiency: "80+ Titanium", tier: "enthusiast" 
      },
      { 
        id: "10", name: "1600W 80+ Titanium", price: 45999, performance: 100, powerConsumption: 0, 
        category: "psu", wattage: 1600, efficiency: "80+ Titanium", tier: "enthusiast" 
      },
    ],
    case: [
      // Budget Cases
      { 
        id: "1", name: "Basic mATX Case", price: 1999, performance: 60, powerConsumption: 0, 
        formFactor: "mATX", category: "case", airflow: "Basic", tier: "budget" 
      },
      { 
        id: "2", name: "Mid Tower Basic", price: 2999, performance: 70, powerConsumption: 0, 
        formFactor: "ATX", category: "case", airflow: "Good", tier: "budget" 
      },
      { 
        id: "3", name: "Budget RGB Case", price: 3999, performance: 72, powerConsumption: 3, 
        formFactor: "ATX", category: "case", airflow: "Good", tier: "budget" 
      },
      // Mid-range Cases
      { 
        id: "4", name: "Mid Tower Gaming", price: 4999, performance: 80, powerConsumption: 5, 
        formFactor: "ATX", category: "case", airflow: "Excellent", tier: "mid-range" 
      },
      { 
        id: "5", name: "RGB Gaming Tower", price: 6999, performance: 82, powerConsumption: 8, 
        formFactor: "ATX", category: "case", airflow: "Excellent", tier: "mid-range" 
      },
      { 
        id: "6", name: "Mesh Front Panel", price: 7999, performance: 85, powerConsumption: 10, 
        formFactor: "ATX", category: "case", airflow: "Excellent", tier: "mid-range" 
      },
      // High-end Cases
      { 
        id: "7", name: "Premium Tower", price: 12999, performance: 90, powerConsumption: 15, 
        formFactor: "ATX", category: "case", airflow: "Exceptional", tier: "high-end" 
      },
      { 
        id: "8", name: "Full Tower Gaming", price: 15999, performance: 92, powerConsumption: 18, 
        formFactor: "E-ATX", category: "case", airflow: "Exceptional", tier: "high-end" 
      },
      { 
        id: "9", name: "Custom Loop Ready", price: 18999, performance: 95, powerConsumption: 20, 
        formFactor: "E-ATX", category: "case", airflow: "Exceptional", tier: "enthusiast" 
      },
      { 
        id: "10", name: "Show Case Glass", price: 25999, performance: 98, powerConsumption: 25, 
        formFactor: "E-ATX", category: "case", airflow: "Exceptional", tier: "enthusiast" 
      },
    ],
    cooler: [
      // Budget Coolers
      { 
        id: "1", name: "Stock Cooler", price: 0, performance: 60, powerConsumption: 5, 
        category: "cooler", type: "Stock", maxTDP: 65, tier: "budget" 
      },
      { 
        id: "2", name: "Basic Tower Cooler", price: 1999, performance: 70, powerConsumption: 3, 
        category: "cooler", type: "Air", maxTDP: 95, tier: "budget" 
      },
      { 
        id: "3", name: "RGB Tower Cooler", price: 2999, performance: 75, powerConsumption: 8, 
        category: "cooler", type: "Air", maxTDP: 120, tier: "budget" 
      },
      // Mid-range Coolers
      { 
        id: "4", name: "Dual Tower Cooler", price: 4999, performance: 80, powerConsumption: 10, 
        category: "cooler", type: "Air", maxTDP: 150, tier: "mid-range" 
      },
      { 
        id: "5", name: "High-End Air Cooler", price: 5999, performance: 85, powerConsumption: 10, 
        category: "cooler", type: "Air", maxTDP: 180, tier: "mid-range" 
      },
      { 
        id: "6", name: "120mm AIO", price: 6999, performance: 82, powerConsumption: 12, 
        category: "cooler", type: "AIO", maxTDP: 150, tier: "mid-range" 
      },
      // High-end Coolers
      { 
        id: "7", name: "240mm AIO", price: 8999, performance: 90, powerConsumption: 15, 
        category: "cooler", type: "AIO", maxTDP: 200, tier: "high-end" 
      },
      { 
        id: "8", name: "280mm AIO", price: 12999, performance: 92, powerConsumption: 18, 
        category: "cooler", type: "AIO", maxTDP: 220, tier: "high-end" 
      },
      { 
        id: "9", name: "360mm AIO", price: 15999, performance: 95, powerConsumption: 20, 
        category: "cooler", type: "AIO", maxTDP: 250, tier: "enthusiast" 
      },
      { 
        id: "10", name: "Custom Loop", price: 35999, performance: 100, powerConsumption: 25, 
        category: "cooler", type: "Custom", maxTDP: 350, tier: "enthusiast" 
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

    // Enhanced cooling adequacy checks
    if (config.cpu && config.cooler) {
      const cpuTDP = config.cpu.powerConsumption;
      const coolerTDP = (config.cooler as any).maxTDP || 0;
      const coolerPerf = config.cooler.performance;
      
      if (coolerTDP > 0 && coolerTDP < cpuTDP) {
        issues.push({
          type: "warning",
          message: `Cooler rated for ${coolerTDP}W, but CPU generates ${cpuTDP}W - thermal throttling possible`
        });
        compatibilityScore -= 15;
      } else if (cpuTDP > 100 && coolerPerf < 80) {
        issues.push({
          type: "warning",
          message: "High-TDP CPU may require better cooling solution for sustained performance"
        });
        compatibilityScore -= 8;
      } else if (coolerTDP === 0 && cpuTDP > 65) {
        issues.push({
          type: "info",
          message: "Stock cooler adequate for basic use, upgrade recommended for overclocking"
        });
        compatibilityScore -= 3;
      }
    }

    // Use case specific recommendations
    if (config.ram) {
      const ramCapacity = config.ram.capacity || 0;
      if (useCase === 'content-creation' && ramCapacity > 0 && ramCapacity < 32) {
        issues.push({
          type: "info",
          message: `Content creation benefits from 32GB+ RAM (current: ${ramCapacity}GB)`
        });
        compatibilityScore -= 3;
      } else if (useCase === 'ai-ml' && ramCapacity > 0 && ramCapacity < 64) {
        issues.push({
          type: "warning",
          message: `AI/ML workloads often require 64GB+ RAM (current: ${ramCapacity}GB)`
        });
        compatibilityScore -= 8;
      } else if (useCase === 'workstation' && ramCapacity > 0 && ramCapacity < 32) {
        issues.push({
          type: "info",
          message: `Workstation use typically benefits from 32GB+ RAM (current: ${ramCapacity}GB)`
        });
        compatibilityScore -= 2;
      }
    }

    // Storage type recommendations
    if (config.storage) {
      const storageType = (config.storage as any).type;
      if (storageType === 'HDD' && (useCase === 'gaming' || useCase === 'content-creation')) {
        issues.push({
          type: "info",
          message: `SSD recommended for faster ${useCase} performance and shorter load times`
        });
        compatibilityScore -= 2;
      }
    }

    // High-end component balance checks
    if (config.cpu && config.motherboard) {
      const cpuTier = (config.cpu as any).tier;
      const mbTier = (config.motherboard as any).tier;
      
      if (cpuTier === 'enthusiast' && mbTier === 'budget') {
        issues.push({
          type: "warning",
          message: "High-end CPU with budget motherboard may limit overclocking potential"
        });
        compatibilityScore -= 5;
      }
    }

    // PSU efficiency for high-power systems
    if (config.psu && totalPower > 400) {
      const psuEfficiency = (config.psu as any).efficiency || "";
      if (!psuEfficiency.includes('Gold')) {
        issues.push({
          type: "info",
          message: "High-power system benefits from 80+ Gold or better PSU efficiency"
        });
        compatibilityScore -= 2;
      }
    }

    // Final compatibility assessment
    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;
    const infoCount = issues.filter(i => i.type === 'info').length;
    
    let assessmentLevel = "Excellent";
    if (compatibilityScore < 70) assessmentLevel = "Poor";
    else if (compatibilityScore < 80) assessmentLevel = "Fair";
    else if (compatibilityScore < 90) assessmentLevel = "Good";

    return {
      issues,
      overallCompatible: errorCount === 0,
      compatibilityScore: Math.max(0, compatibilityScore),
      assessmentLevel,
      hasErrors: errorCount > 0,
      warningCount,
      infoCount,
      totalIssues: errorCount + warningCount + infoCount
    };
  }, [config]);

  // Advanced performance prediction with realistic calculations
  const performancePrediction = useMemo((): PerformancePrediction | null => {
    if (!config.cpu || !config.gpu) return null;

    const cpuScore = config.cpu.performance;
    const gpuScore = config.gpu.performance;
    const ramScore = config.ram?.performance || 70;
    const storageScore = config.storage?.performance || 75;
    const ramCapacity = config.ram?.capacity || 16;
    const gpuVram = config.gpu.vram || 8;

    // Bottleneck analysis
    const cpuGpuDiff = Math.abs(cpuScore - gpuScore);
    let bottleneckComponent = 'balanced';
    if (cpuGpuDiff > 15) {
      bottleneckComponent = cpuScore < gpuScore ? 'cpu' : 'gpu';
    }

    // Gaming performance with more realistic calculations
    let gamingScore = cpuScore * 0.25 + gpuScore * 0.6 + ramScore * 0.1 + storageScore * 0.05;
    
    // Apply bottleneck penalty
    if (bottleneckComponent === 'cpu') {
      gamingScore *= 0.85; // CPU bottleneck reduces overall gaming performance
    }
    
    // RAM capacity influence on gaming
    if (ramCapacity < 16) {
      gamingScore *= 0.9; // Less than 16GB reduces gaming performance
    } else if (ramCapacity >= 32) {
      gamingScore *= 1.05; // 32GB+ provides slight boost
    }
    
    gamingScore = Math.min(gamingScore, 100);

    // Productivity performance for different use cases
    let productivityScore = cpuScore * 0.5 + gpuScore * 0.2 + ramScore * 0.2 + storageScore * 0.1;
    
    // Use case specific adjustments
    if (useCase === 'content-creation') {
      productivityScore = cpuScore * 0.4 + gpuScore * 0.3 + ramScore * 0.2 + storageScore * 0.1;
      if (ramCapacity < 32) productivityScore *= 0.85;
    } else if (useCase === 'ai-ml') {
      productivityScore = gpuScore * 0.5 + cpuScore * 0.3 + ramScore * 0.2;
      if (ramCapacity < 64) productivityScore *= 0.8;
      if (gpuVram < 16) productivityScore *= 0.9;
    } else if (useCase === 'workstation') {
      productivityScore = cpuScore * 0.6 + ramScore * 0.25 + storageScore * 0.15;
      if (ramCapacity < 32) productivityScore *= 0.88;
    }
    
    productivityScore = Math.min(productivityScore, 100);

    // More realistic FPS predictions based on actual GPU tiers and performance data
    const getRealisticFPS = (resolution: string, quality: string) => {
      let baseFPS = 60;
      
      // Base FPS by GPU performance tier
      if (gpuScore >= 95) baseFPS = 140; // RTX 4080/4090 tier
      else if (gpuScore >= 88) baseFPS = 120; // RTX 4070 Ti tier
      else if (gpuScore >= 80) baseFPS = 100; // RTX 4060 Ti/4070 tier
      else if (gpuScore >= 72) baseFPS = 85;  // RTX 4060/3060 Ti tier
      else if (gpuScore >= 65) baseFPS = 70;  // GTX 1660 Super tier
      else baseFPS = 50;
      
      // Resolution impact
      if (resolution.includes('1440p')) baseFPS *= 0.7;
      else if (resolution.includes('4K')) baseFPS *= 0.4;
      
      // Quality settings impact
      if (quality.includes('Ultra')) baseFPS *= 0.85;
      else if (quality.includes('High')) baseFPS *= 0.95;
      
      // CPU bottleneck impact
      if (bottleneckComponent === 'cpu') baseFPS *= 0.9;
      
      return Math.round(baseFPS);
    };

    const fps = {
      "1080p Ultra": getRealisticFPS('1080p', 'Ultra'),
      "1080p High": getRealisticFPS('1080p', 'High'),
      "1440p Ultra": getRealisticFPS('1440p', 'Ultra'),
      "1440p High": getRealisticFPS('1440p', 'High'),
      "4K High": getRealisticFPS('4K', 'High'),
      "VR Gaming": Math.min(getRealisticFPS('1080p', 'High'), 90) // VR needs consistent 90+ FPS
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

    // Enhanced future-proofing assessment
    const avgPerformance = (gamingScore + productivityScore) / 2;
    let futureProofing = avgPerformance;
    
    // Future-proofing factors
    if (ramCapacity >= 32) futureProofing += 10;
    else if (ramCapacity >= 16) futureProofing += 5;
    
    if (gpuVram >= 16) futureProofing += 8;
    else if (gpuVram >= 12) futureProofing += 5;
    
    if ((config.storage as any)?.type?.includes('NVMe')) futureProofing += 3;
    
    // High-end component bonus
    const highEndComponents = Object.values(config).filter(comp => 
      (comp as any)?.tier === 'enthusiast' || (comp as any)?.tier === 'high-end'
    ).length;
    futureProofing += highEndComponents * 2;
    
    futureProofing = Math.min(100, futureProofing);

    // Performance recommendations
    const recommendations = [];
    if (bottleneckComponent === 'cpu') {
      recommendations.push('Consider upgrading CPU for better gaming performance');
    } else if (bottleneckComponent === 'gpu') {
      recommendations.push('GPU upgrade would provide the biggest performance boost');
    }
    
    if (ramCapacity < 16) {
      recommendations.push('Upgrade to 16GB RAM for modern gaming');
    }
    
    if ((config.storage as any)?.type === 'HDD') {
      recommendations.push('SSD upgrade will significantly improve load times');
    }

    return {
      gamingScore: Math.round(gamingScore),
      productivityScore: Math.round(productivityScore),
      fps,
      thermalRating,
      noiseLevel,
      futureProofing: Math.round(futureProofing),
      bottleneckComponent,
      recommendations,
      useCaseScore: useCase === 'gaming' ? Math.round(gamingScore) : Math.round(productivityScore),
      performanceCategory: avgPerformance >= 90 ? 'Enthusiast' : 
                          avgPerformance >= 80 ? 'High-End' : 
                          avgPerformance >= 70 ? 'Mid-Range' : 'Budget'
    };
  }, [config]);

  // REVOLUTIONARY Smart Build Optimization System 
  const optimizeForBudget = () => {
    if (!autoOptimize) return;

    // Define ideal builds by budget range for maximum performance
    const getBuildTemplate = (budget: number, useCase: string) => {
      if (useCase === 'gaming') {
        if (budget >= 90000) {
          return {
            gpu: { minPrice: 50000, targetTier: 'high-end' },
            cpu: { minPrice: 25000, targetTier: 'high-end' },
            ram: { minCapacity: 32, targetTier: 'mid-range' },
            storage: { minCapacity: 1000, targetTier: 'mid-range' },
            support: { budget: budget * 0.15 }
          };
        } else if (budget >= 60000) {
          return {
            gpu: { minPrice: 28000, targetTier: 'mid-range' },
            cpu: { minPrice: 18000, targetTier: 'mid-range' },
            ram: { minCapacity: 16, targetTier: 'mid-range' },
            storage: { minCapacity: 500, targetTier: 'budget' },
            support: { budget: budget * 0.18 }
          };
        } else {
          return {
            gpu: { minPrice: 16000, targetTier: 'budget' },
            cpu: { minPrice: 8000, targetTier: 'budget' },
            ram: { minCapacity: 16, targetTier: 'budget' },
            storage: { minCapacity: 500, targetTier: 'budget' },
            support: { budget: budget * 0.20 }
          };
        }
      }
      // Add more use cases as needed
      return {
        gpu: { minPrice: 25000, targetTier: 'mid-range' },
        cpu: { minPrice: 20000, targetTier: 'mid-range' },
        ram: { minCapacity: 16, targetTier: 'mid-range' },
        storage: { minCapacity: 500, targetTier: 'budget' },
        support: { budget: budget * 0.15 }
      };
    };

    const buildTemplate = getBuildTemplate(budget, useCase);

    const config: BuildConfig = {
      cpu: null,
      gpu: null,
      ram: null,
      storage: null,
      motherboard: null,
      psu: null,
      case: null,
      cooler: null
    };

    console.log('🎯 Starting Smart Optimization with budget:', budget);
    
    // STEP 1: Select best GPU within budget (most important for gaming)
    const gpuBudget = Math.min(budget * 0.50, 80000); // Up to 50% budget or 80k max
    const bestGPUs = components.gpu
      .filter(gpu => gpu.price >= buildTemplate.gpu.minPrice && gpu.price <= gpuBudget)
      .sort((a, b) => b.performance - a.performance);
    
    config.gpu = bestGPUs[0] || components.gpu.find(gpu => gpu.price <= gpuBudget);
    console.log('🎮 Selected GPU:', config.gpu?.name, config.gpu?.price);

    // STEP 2: Select best CPU that won't bottleneck GPU
    const cpuBudget = Math.min(budget * 0.30, 50000);
    const targetCPUPerformance = config.gpu ? config.gpu.performance * 0.8 : 80; // CPU should be 80% of GPU performance
    
    const bestCPUs = components.cpu
      .filter(cpu => cpu.performance >= targetCPUPerformance && cpu.price <= cpuBudget)
      .sort((a, b) => (b.performance / b.price) - (a.performance / a.price));
    
    config.cpu = bestCPUs[0] || components.cpu
      .filter(cpu => cpu.price <= cpuBudget)
      .sort((a, b) => b.performance - a.performance)[0];
    console.log('🖥️ Selected CPU:', config.cpu?.name, config.cpu?.price);
    
    // STAGE 1: Essential Components First (motherboard, psu, case, cooler)
    // Use aggressive budget allocation to utilize full budget
    const essentialBudget = Math.max(budget * 0.20, 20000); // Increased to 20% for better components
    const supportAllocations = {
      motherboard: essentialBudget * 0.35,
      psu: essentialBudget * 0.35, 
      case: essentialBudget * 0.20,
      cooler: essentialBudget * 0.10
    };
    
    
    // STEP 3: Select COMPATIBLE motherboard for the chosen CPU 
    const motherboardBudget = Math.min(budget * 0.10, 20000);
    if (config.cpu) {
      const compatibleMBs = components.motherboard.filter(mb => mb.socket === config.cpu?.socket);
      if (compatibleMBs.length > 0) {
        // Get the best compatible motherboard within budget
        config.motherboard = compatibleMBs
          .filter(mb => mb.price <= motherboardBudget)
          .sort((a, b) => b.performance - a.performance)[0] ||
          compatibleMBs.sort((a, b) => a.price - b.price)[0]; // Fallback to cheapest compatible
        console.log('🔌 Selected Compatible Motherboard:', config.motherboard?.name, config.motherboard?.socket);
      }
    }
    
    // STEP 4: Select COMPATIBLE RAM for the motherboard
    const ramBudget = Math.min(budget * 0.12, 20000);
    if (config.motherboard) {
      const compatibleRAM = components.ram.filter(ram => 
        ram.memoryType === config.motherboard?.memoryType && 
        (ram as any).capacity >= buildTemplate.ram.minCapacity
      );
      if (compatibleRAM.length > 0) {
        config.ram = compatibleRAM
          .filter(ram => ram.price <= ramBudget)
          .sort((a, b) => b.performance - a.performance)[0] ||
          compatibleRAM.sort((a, b) => a.price - b.price)[0];
        console.log('💾 Selected Compatible RAM:', config.ram?.name, config.ram?.memoryType);
      }
    }
    
    // STEP 5: Storage - get best performance within budget
    const storageBudget = Math.min(budget * 0.08, 15000);
    config.storage = components.storage
      .filter(storage => (storage as any).capacity >= buildTemplate.storage.minCapacity && storage.price <= storageBudget)
      .sort((a, b) => b.performance - a.performance)[0] ||
      components.storage.filter(storage => storage.price <= storageBudget)
      .sort((a, b) => b.performance - a.performance)[0];
    console.log('💽 Selected Storage:', config.storage?.name);
    
    // STEP 6: Calculate total power and select adequate PSU
    const totalPower = Object.values(config).reduce((sum, component) => 
      sum + (component?.powerConsumption || 0), 0
    );
    const requiredWattage = Math.max(totalPower * 1.5, 550); // 50% headroom minimum 550W
    
    config.psu = components.psu
      .filter(psu => (psu.wattage || 0) >= requiredWattage)
      .sort((a, b) => {
        // Prefer Gold efficiency and adequate wattage
        const aEfficiency = (a as any).efficiency?.includes('Gold') ? 2 : (a as any).efficiency?.includes('Bronze') ? 1 : 0;
        const bEfficiency = (b as any).efficiency?.includes('Gold') ? 2 : (b as any).efficiency?.includes('Bronze') ? 1 : 0;
        return (b.performance + bEfficiency) - (a.performance + aEfficiency);
      })[0];
    console.log('⚡ Selected PSU:', config.psu?.name, (config.psu as any)?.wattage + 'W');
    
    // STEP 7: Case selection
    config.case = components.case
      .filter(caseComp => caseComp.price <= 8000) // Max 8k for case
      .sort((a, b) => b.performance - a.performance)[0] ||
      components.case.sort((a, b) => a.price - b.price)[0]; // Fallback to cheapest
    
    // STEP 8: Cooler based on CPU requirements 
    if (config.cpu && config.cpu.powerConsumption > 100) {
      // High power CPU needs AIO or high-end air cooler
      const powerfulCoolers = components.cooler.filter(cooler => 
        (cooler as any).maxTDP >= config.cpu!.powerConsumption * 1.2
      );
      config.cooler = powerfulCoolers
        .filter(cooler => cooler.price <= 10000)
        .sort((a, b) => b.performance - a.performance)[0] ||
        components.cooler[0]; // Fallback to stock cooler
    } else {
      config.cooler = components.cooler[0]; // Stock cooler for low power CPUs
    }
    // STEP 9: Final optimization - use any remaining budget for upgrades
    const currentTotal = Object.values(config).reduce((total, component) => 
      total + (component?.price || 0), 0
    );
    
    const remainingBudget = budget - currentTotal;
    console.log('💰 Budget Analysis:', { total: currentTotal, budget, remaining: remainingBudget, utilization: `${Math.round(currentTotal/budget*100)}%` });
    
    // If significant budget remains, upgrade key components
    if (remainingBudget > budget * 0.15) {
      // Prioritize GPU upgrade for gaming
      if (useCase === 'gaming' && config.gpu) {
        const betterGPU = components.gpu
          .filter(gpu => gpu.price > config.gpu!.price && gpu.price <= config.gpu!.price + remainingBudget * 0.6)
          .sort((a, b) => b.performance - a.performance)[0];
        if (betterGPU) {
          console.log('🚀 Upgrading GPU from', config.gpu.name, 'to', betterGPU.name);
          config.gpu = betterGPU;
        }
      }
      
      // Upgrade CPU if budget allows
      const currentTotal2 = Object.values(config).reduce((total, component) => 
        total + (component?.price || 0), 0
      );
      const remainingBudget2 = budget - currentTotal2;
      
      if (remainingBudget2 > budget * 0.10 && config.cpu) {
        const betterCPU = components.cpu
          .filter(cpu => 
            cpu.socket === config.motherboard?.socket &&
            cpu.price > config.cpu!.price && 
            cpu.price <= config.cpu!.price + remainingBudget2 * 0.8
          )
          .sort((a, b) => b.performance - a.performance)[0];
        if (betterCPU) {
          console.log('🚀 Upgrading CPU from', config.cpu.name, 'to', betterCPU.name);
          config.cpu = betterCPU;
        }
      }
    }
    
    // STEP 10: Show final budget analysis and update config
    const finalTotalPrice = Object.values(config).reduce((total, component) => 
      total + (component?.price || 0), 0
    );
    
    console.log('💰 Final Build Cost:', finalTotalPrice, 'Budget Utilization:', Math.round(finalTotalPrice/budget*100) + '%');
    console.log('🔧 Final Config:', {
      cpu: config.cpu?.name,
      gpu: config.gpu?.name,
      ram: config.ram?.name,
      motherboard: config.motherboard?.name,
      psu: config.psu?.name
    });
    
    // Update configuration
    setConfig(config);
  };
  
  // Legacy upgrade logic (keeping for compatibility)
  const legacyUpgradeLogic = () => {
    const finalTotalPrice = Object.values(config).reduce((total, component) => 
      total + (component?.price || 0), 0
    );
    
    const remainingBudgetAfterSelection = budget - finalTotalPrice;
    
    // If we have significant remaining budget, upgrade components intelligently
    if (remainingBudgetAfterSelection > budget * 0.1) { // More than 10% budget left
      const upgradePriority = useCase === 'gaming' ? 
        ['gpu', 'cpu', 'ram', 'storage', 'motherboard', 'psu'] :
        useCase === 'content-creation' ?
        ['cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu'] :
        ['cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu'];
      
      for (const componentType of upgradePriority) {
        const currentComponent = config[componentType as keyof BuildConfig];
        if (!currentComponent) continue;
        
        const componentList = components[componentType as keyof typeof components];
        const currentTotalPrice = Object.values(config).reduce((total, component) => 
          total + (component?.price || 0), 0
        );
        
        const availableForUpgrade = budget - currentTotalPrice + currentComponent.price;
        
        const upgradeOption = componentList
          .filter(comp => comp.price > currentComponent.price && comp.price <= availableForUpgrade)
          .reduce((best, current) => {
            if (!best) return current;
            const currentScore = current.performance / (current.price / 1000);
            const bestScore = best.performance / (best.price / 1000);
            return currentScore > bestScore ? current : best;
          }, null as any);
        
        if (upgradeOption && upgradeOption.performance > currentComponent.performance) {
          config[componentType as keyof BuildConfig] = upgradeOption;
        }
      }
    }
    
    // If over budget, downgrade least important components
    const overBudgetAmount = Object.values(config).reduce((total, component) => 
      total + (component?.price || 0), 0
    ) - budget;
    
    if (overBudgetAmount > 0) {
      const downgradePriority = ['cooler', 'case', 'storage', 'ram', 'cpu', 'gpu', 'motherboard', 'psu'];
      
      for (const componentType of downgradePriority) {
        const currentTotalPrice = Object.values(config).reduce((total, component) => 
          total + (component?.price || 0), 0
        );
        
        if (currentTotalPrice <= budget) break;
        
        const currentComponent = config[componentType as keyof BuildConfig];
        if (!currentComponent) continue;
        
        const componentList = components[componentType as keyof typeof components];
        const cheaperOption = componentList
          .filter(comp => comp.price < currentComponent.price && comp.performance >= currentComponent.performance * 0.8)
          .reduce((best, current) => {
            if (!best) return current;
            const currentScore = current.performance / (current.price / 1000);
            const bestScore = best.performance / (best.price / 1000);
            return currentScore > bestScore ? current : best;
          }, null as any);
        
        if (cheaperOption) {
          config[componentType as keyof BuildConfig] = cheaperOption;
        }
      }
    }
    
    // Update configuration
    setConfig(config);
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

  // Real-time pricing with dynamic updates
  const [priceMultiplier, setPriceMultiplier] = useState(1.0);
  const [lastPriceUpdate, setLastPriceUpdate] = useState(Date.now());

  // Simulate real-time price fluctuations (in real implementation, this would come from an API)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate market price fluctuations (±5%)
      const variation = 0.95 + Math.random() * 0.1;
      setPriceMultiplier(variation);
      setLastPriceUpdate(Date.now());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getAdjustedPrice = (basePrice: number) => {
    return Math.round(basePrice * priceMultiplier);
  };

  const totalPrice = Object.values(config).reduce((total, component) => {
    return total + getAdjustedPrice(component?.price || 0);
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
                <label className="text-sm font-medium">Smart Auto-Optimize</label>
                <Switch checked={autoOptimize} onCheckedChange={setAutoOptimize} />
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                Advanced Settings
              </Button>
              {autoOptimize && (
                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  AI-powered optimization enabled
                </div>
              )}
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
              {priceMultiplier !== 1.0 && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  Live pricing active
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Component Selection */}
        <div className="xl:col-span-3">
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Settings className="h-6 w-6 text-blue-600" />
                Component Selection
              </CardTitle>
              <p className="text-gray-600 text-sm">Choose components for your build using the dropdowns below</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(components).map(([componentType, componentList]) => {
                  const selectedComponent = config[componentType as keyof BuildConfig];
                  const getIcon = () => {
                    switch(componentType) {
                      case 'cpu': return <Cpu className="h-5 w-5" />;
                      case 'gpu': return <Monitor className="h-5 w-5" />;
                      case 'ram': return <MemoryStick className="h-5 w-5" />;
                      case 'storage': return <HardDrive className="h-5 w-5" />;
                      case 'psu': return <Zap className="h-5 w-5" />;
                      case 'motherboard': return <Settings className="h-5 w-5" />;
                      case 'case': return <Monitor className="h-5 w-5" />;
                      case 'cooler': return <Thermometer className="h-5 w-5" />;
                      default: return <Settings className="h-5 w-5" />;
                    }
                  };

                  return (
                    <div key={componentType} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {getIcon()}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base capitalize">
                            {componentType.replace('_', ' ')}
                          </h3>
                          {selectedComponent && (
                            <p className="text-sm text-green-600 font-medium">
                              Selected: {selectedComponent.name}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <Select 
                        value={selectedComponent?.id || "none"} 
                        onValueChange={(value) => {
                          if (value === "none") {
                            setConfig(prev => ({ ...prev, [componentType]: null }));
                          } else {
                            const component = componentList.find(c => c.id === value);
                            if (component) {
                              const adjustedPrice = getAdjustedPrice(component.price);
                              const currentComponentAdjustedPrice = getAdjustedPrice(selectedComponent?.price || 0);
                              const isAffordable = totalPrice - currentComponentAdjustedPrice + adjustedPrice <= budget;
                              
                              if (isAffordable) {
                                setConfig(prev => ({ ...prev, [componentType]: component }));
                              }
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="w-full h-12 border-2 hover:border-blue-300 transition-colors">
                          <SelectValue placeholder={`Choose ${componentType.replace('_', ' ')}`} />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          <SelectItem value="none" className="text-gray-500 italic">
                            None selected
                          </SelectItem>
                          {componentList.map((component) => {
                            const adjustedPrice = getAdjustedPrice(component.price);
                            const currentComponentAdjustedPrice = getAdjustedPrice(selectedComponent?.price || 0);
                            const isAffordable = totalPrice - currentComponentAdjustedPrice + adjustedPrice <= budget;
                            
                            return (
                              <SelectItem 
                                key={component.id} 
                                value={component.id}
                                disabled={!isAffordable && !selectedComponent}
                                className={`cursor-pointer ${!isAffordable && !selectedComponent ? 'opacity-50' : ''}`}
                              >
                                <div className="flex justify-between items-center w-full">
                                  <div className="flex-1">
                                    <div className="font-medium">{component.name}</div>
                                    <div className="text-xs text-gray-500 flex gap-2">
                                      <span>Perf: {component.performance}%</span>
                                      <span>Power: {component.powerConsumption}W</span>
                                      {(component as any).cores && <span>Cores: {(component as any).cores}</span>}
                                      {(component as any).vram && <span>VRAM: {(component as any).vram}GB</span>}
                                      {(component as any).capacity && <span>{(component as any).capacity}GB</span>}
                                      {(component as any).wattage && <span>{(component as any).wattage}W</span>}
                                    </div>
                                  </div>
                                  <div className="text-right ml-3">
                                    <div className={`font-bold text-sm ${
                                      !isAffordable && !selectedComponent ? 'text-red-600' : 'text-blue-600'
                                    }`}>
                                      {component.price === 0 ? 'Included' : formatPrice(adjustedPrice)}
                                    </div>
                                    {component.price > 0 && priceMultiplier !== 1.0 && (
                                      <div className="text-xs text-gray-500">
                                        {priceMultiplier > 1.0 ? '+' : ''}{((priceMultiplier - 1) * 100).toFixed(1)}%
                                      </div>
                                    )}
                                    {!isAffordable && !selectedComponent && (
                                      <div className="text-xs text-red-500 font-medium">Over Budget</div>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
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