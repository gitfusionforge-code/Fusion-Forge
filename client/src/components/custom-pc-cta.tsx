import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Settings, 
  Cpu, 
  Monitor, 
  Zap, 
  Shield, 
  Headphones, 
  ArrowRight,
  CheckCircle
} from "lucide-react";

export default function CustomPCCTA() {
  const benefits = [
    { icon: Settings, text: "Tailored to your exact needs" },
    { icon: Shield, text: "Premium warranty & support" },
    { icon: Headphones, text: "Expert consultation included" },
    { icon: CheckCircle, text: "Professional assembly & testing" }
  ];

  const useCases = [
    { 
      title: "Gaming Beast", 
      description: "High-performance gaming rigs for enthusiasts",
      icon: Monitor,
      price: "₹75,000+"
    },
    { 
      title: "Content Creation", 
      description: "Powerful workstations for video editing & streaming",
      icon: Cpu,
      price: "₹1,20,000+"
    },
    { 
      title: "Professional Workstation", 
      description: "Enterprise-grade systems for demanding tasks",
      icon: Zap,
      price: "₹1,50,000+"
    }
  ];

  return (
    <section className="fusion-gradient text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="bg-tech-orange text-white mb-4 px-4 py-2">
            Custom PC Solutions
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-white">
            Need Something Unique?
          </h2>
          <p className="text-lg text-white max-w-3xl mx-auto">
            Our expert team creates custom PC builds tailored exactly to your requirements, 
            budget, and performance goals. From gaming powerhouses to professional workstations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Benefits Section */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold mb-6 text-white">Why Choose Custom?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-tech-orange/20 rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 text-tech-orange" />
                    </div>
                    <span className="text-white">{benefit.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Use Cases Section */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold mb-6 text-white">Popular Custom Builds</h3>
            <div className="space-y-4">
              {useCases.map((useCase, index) => {
                const Icon = useCase.icon;
                return (
                  <Card key={index} className="bg-white/20 border-white/30 backdrop-blur-sm hover:bg-white/25 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-tech-orange/30 rounded-lg flex items-center justify-center">
                            <Icon className="h-4 w-4 text-tech-orange" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white">{useCase.title}</h4>
                            <p className="text-sm text-white font-medium">{useCase.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-white/50 text-white font-semibold bg-white/10">
                          {useCase.price}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold mb-4 text-white">Ready to Build Your Dream PC?</h3>
            <p className="text-white mb-6 max-w-2xl mx-auto">
              Get a free consultation with our PC building experts. We'll help you design 
              the perfect system within your budget and requirements.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/configurator">
                <Button className="bg-tech-orange hover:bg-orange-600 text-white px-8 py-3 text-lg">
                  <Settings className="mr-2 h-5 w-5" />
                  Start Configuring
                </Button>
              </Link>
              
              <Link href="/contact">
                <Button className="bg-white/20 border-2 border-white text-white hover:bg-white/30 px-8 py-3 text-lg backdrop-blur-sm">
                  <Headphones className="mr-2 h-5 w-5" />
                  Get Expert Help
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-white">
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-400" />
                Free Consultation
              </span>
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-400" />
                3-Year Warranty
              </span>
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-400" />
                Professional Assembly
              </span>
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-400" />
                Lifetime Support
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}