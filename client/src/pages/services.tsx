import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/enhanced-seo-head";
import { Link } from "wouter";
import { 
  Gamepad2, 
  Camera, 
  Briefcase, 
  Brain, 
  Server, 
  Wrench, 
  Shield, 
  Headphones,
  CheckCircle,
  Clock,
  Award,
  Zap
} from "lucide-react";

export default function Services() {
  const services = [
    {
      icon: Gamepad2,
      title: "Gaming PCs",
      description: "High-performance gaming rigs for enthusiasts and competitive players",
      features: [
        "Latest GPU and CPU combinations",
        "High refresh rate gaming optimization",
        "RGB lighting and custom aesthetics",
        "Overclocking and performance tuning"
      ],
      priceRange: "₹70,000 - ₹5,00,000",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Camera,
      title: "Content Creation Workstations",
      description: "Powerful machines for video editing, 3D rendering, and creative work",
      features: [
        "Multi-core processors for rendering",
        "Professional GPU configurations",
        "High-speed storage solutions",
        "Color-accurate display recommendations"
      ],
      priceRange: "₹1,20,000 - ₹8,00,000",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Briefcase,
      title: "Office & Productivity",
      description: "Reliable business computers for everyday productivity tasks",
      features: [
        "Energy-efficient components",
        "Business-grade reliability",
        "Multi-monitor support",
        "Enterprise security features"
      ],
      priceRange: "₹25,000 - ₹1,50,000",
      color: "from-green-500 to-teal-500"
    },
    {
      icon: Brain,
      title: "AI/ML Workstations",
      description: "Specialized systems for machine learning and data science",
      features: [
        "CUDA-enabled GPU configurations",
        "High-memory capacity systems",
        "Optimized for TensorFlow/PyTorch",
        "Multi-GPU support available"
      ],
      priceRange: "₹2,00,000 - ₹15,00,000",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Server,
      title: "Server Solutions",
      description: "Enterprise-grade servers for businesses and data centers",
      features: [
        "Redundant storage configurations",
        "Server-class components",
        "Remote management capabilities",
        "24/7 monitoring support"
      ],
      priceRange: "₹1,50,000 - ₹10,00,000",
      color: "from-gray-600 to-gray-800"
    },
    {
      icon: Wrench,
      title: "Custom Modifications",
      description: "Upgrade and customize your existing PC setup",
      features: [
        "Component upgrades and replacements",
        "Custom loop cooling systems",
        "Case modifications and modding",
        "Performance optimization"
      ],
      priceRange: "₹5,000 - ₹2,00,000",
      color: "from-yellow-500 to-orange-500"
    }
  ];

  const supportServices = [
    {
      icon: Shield,
      title: "3-Year Comprehensive Warranty",
      description: "Complete coverage for all components and labor"
    },
    {
      icon: Headphones,
      title: "24/7 Technical Support",
      description: "Round-the-clock assistance via phone, email, and chat"
    },
    {
      icon: CheckCircle,
      title: "Free Software Setup",
      description: "OS installation, drivers, and essential software configuration"
    },
    {
      icon: Clock,
      title: "Quick Turnaround",
      description: "Most builds completed within 3-7 business days"
    }
  ];

  const process = [
    {
      step: "01",
      title: "Consultation",
      description: "Discuss your requirements, budget, and use case with our experts"
    },
    {
      step: "02",
      title: "Design & Quote",
      description: "Receive a detailed configuration and transparent pricing"
    },
    {
      step: "03",
      title: "Component Sourcing",
      description: "We source premium components from authorized dealers"
    },
    {
      step: "04",
      title: "Assembly & Testing",
      description: "Professional assembly with rigorous testing and optimization"
    },
    {
      step: "05",
      title: "Delivery & Support",
      description: "Safe delivery with ongoing support and warranty coverage"
    }
  ];

  return (
    <div className="min-h-screen bg-light-grey py-16">
      <SEOHead 
        title="PC Building Services - Gaming, Workstation & Custom Computers"
        description="Professional PC building services including gaming PCs, workstations, AI/ML systems, and custom modifications. Expert assembly with 3-year warranty."
        keywords="PC building services, custom gaming PCs, workstation computers, AI workstations, server solutions"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-deep-blue mb-6">
            Our Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive PC building services tailored to your specific needs and requirements
          </p>
        </div>

        {/* Main Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {services.map((service, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 h-full">
              <CardHeader>
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${service.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-deep-blue">{service.title}</CardTitle>
                <p className="text-gray-600">{service.description}</p>
                <Badge variant="outline" className="w-fit">
                  {service.priceRange}
                </Badge>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-tech-orange mr-2 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Process Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-deep-blue mb-4">Our Process</h2>
            <p className="text-lg text-gray-600">From consultation to delivery, here's how we build your perfect PC</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {process.map((item, index) => (
              <div key={index} className="text-center relative">
                <div className="bg-tech-orange text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-deep-blue mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
                {index < process.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-gray-200 -translate-x-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Support Services */}
        <Card className="mb-20">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-deep-blue text-center">
              What's Included
            </CardTitle>
            <p className="text-center text-gray-600">
              Every build comes with comprehensive support and services
            </p>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {supportServices.map((service, index) => (
                <div key={index} className="text-center">
                  <div className="bg-deep-blue rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <service.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-deep-blue mb-2">{service.title}</h3>
                  <p className="text-sm text-gray-600">{service.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-deep-blue to-bright-blue text-white">
          <CardContent className="p-12 text-center">
            <Zap className="h-16 w-16 text-tech-orange mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4 text-white">Ready to Build Your Dream PC?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-white">
              Get started with a free consultation and detailed quote tailored to your needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button className="bg-tech-orange hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold border-0">
                  Get Free Quote
                </Button>
              </Link>
              <Link href="/builds">
                <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-deep-blue px-8 py-3 rounded-lg font-semibold bg-white/10 backdrop-blur-sm">
                  View Sample Builds
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}