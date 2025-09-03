import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Cpu, Zap, Shield, Award } from "lucide-react";
import fusionForgeLogo from "@assets/generated_images/Optimized_Fusion_Forge_logo_7b2e6c20.png";


export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 py-20 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iNSIgY3k9IjUiIHI9IjUiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white space-y-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <img 
                  src={fusionForgeLogo} 
                  alt="Fusion Forge PCs" 
                  loading="eager"
                  decoding="async"
                  className="h-16 w-16 object-contain"
                  width="64"
                  height="64"
                />
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">
                    <span className="bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">
                      Fusion Forge PCs
                    </span>
                  </h1>
                  <Badge variant="secondary" className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 text-sm font-medium mt-2">
                    Premium PC Building Service
                  </Badge>
                </div>
              </div>
              <h2 className="text-4xl lg:text-6xl font-bold leading-tight text-white">
                Custom PC Builds for
                <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent"> Every Budget</span>
              </h2>
              <p className="text-xl text-white font-medium max-w-xl">
                From budget office computers to extreme gaming rigs, we build powerful PCs tailored to your needs with professional assembly and lifetime support.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/builds">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold">
                  Browse PC Builds
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white hover:text-deep-blue px-8 py-4 text-lg font-semibold border-2">
                  Get Custom Quote
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400">500+</div>
                <div className="text-sm text-white">Builds Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400">2 Years</div>
                <div className="text-sm text-white">Warranty</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400">24/7</div>
                <div className="text-sm text-white">Support</div>
              </div>
            </div>
          </div>

          {/* Right Content - Features */}
          <div className="space-y-6">
            <div className="grid gap-4">
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500 rounded-full">
                      <Cpu className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Latest Components</h3>
                      <p className="text-white">Latest Intel & AMD processors, NVIDIA & AMD graphics cards</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500 rounded-full">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Performance Tuned</h3>
                      <p className="text-white">Optimized for gaming, content creation, and professional work</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500 rounded-full">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Quality Assured</h3>
                      <p className="text-white">Professional assembly, testing, and quality control</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500 rounded-full">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Expert Support</h3>
                      <p className="text-white">Dedicated support team and comprehensive warranty</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}