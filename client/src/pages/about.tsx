import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/enhanced-seo-head";
import { Award, Users, Shield, Clock, CheckCircle, Star } from "lucide-react";

export default function About() {
  const stats = [
    { icon: Users, label: "Happy Customers", value: "2,500+" },
    { icon: Award, label: "Years Experience", value: "8+" },
    { icon: Shield, label: "Warranty Period", value: "3 Years" },
    { icon: Clock, label: "Support Hours", value: "24/7" },
  ];

  const features = [
    "Premium component sourcing from authorized dealers",
    "Professional assembly with rigorous testing",
    "Custom cable management and thermal optimization",
    "Comprehensive 3-year warranty coverage",
    "Lifetime technical support and consultation",
    "Free software installation and optimization",
  ];

  const testimonials = [
    {
      name: "Arjun Sharma",
      role: "Content Creator",
      comment: "FusionForge built me the perfect workstation for 4K video editing. The performance is incredible and their support team is amazing.",
      rating: 5,
    },
    {
      name: "Priya Patel",
      role: "Competitive Gamer",
      comment: "Got my dream gaming rig built here. 240fps gaming at 1440p with perfect temperatures. Couldn't be happier!",
      rating: 5,
    },
    {
      name: "Rajesh Kumar",
      role: "Software Developer",
      comment: "Their AI/ML workstation handles my deep learning projects effortlessly. Professional service from start to finish.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-light-grey py-16">
      <SEOHead 
        title="About FusionForge PCs - Professional PC Building Service"
        description="Learn about FusionForge PCs, India's premier custom PC building service. 8+ years of experience, 2500+ satisfied customers, and premium computer configurations."
        keywords="about FusionForge, PC building service, custom computers India, professional PC assembly"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-deep-blue mb-6">
            About FusionForge PCs
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Where Innovation Meets Performance - Crafting premium custom PCs since 2016
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="mb-16 bg-gradient-to-r from-blue-800 to-blue-600 text-white border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-6 text-white">Our Mission</h2>
            <p className="text-xl leading-relaxed max-w-4xl mx-auto text-white opacity-95">
              To forge the perfect fusion of cutting-edge technology and exceptional craftsmanship, 
              delivering custom PCs that exceed expectations and empower our customers to achieve their goals.
            </p>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-6">
                <stat.icon className="h-8 w-8 text-tech-orange mx-auto mb-4" />
                <div className="text-3xl font-bold text-deep-blue mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Our Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-deep-blue mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                Founded in 2016 by passionate PC enthusiasts, FusionForge PCs began as a dream to make 
                high-performance custom computers accessible to everyone in India.
              </p>
              <p>
                What started as a small workshop has grown into India's most trusted custom PC building 
                service, with over 2,500 satisfied customers and counting.
              </p>
              <p>
                We believe every user deserves a computer that's perfectly tailored to their needs, 
                whether it's for gaming, content creation, or professional work.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-8 mb-6">
                <div className="text-4xl font-bold text-white mb-2">FusionForge</div>
                <div className="text-blue-200">PC Building Excellence</div>
              </div>
              <p className="text-gray-600 max-w-sm">
                Professional PC assembly with precision, quality, and performance in mind.
              </p>
            </div>
          </div>
        </div>

        {/* What We Offer */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-deep-blue text-center">
              What Makes Us Different
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-tech-orange mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-deep-blue text-center mb-12">
            What Our Customers Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="h-full">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.comment}"</p>
                  <div>
                    <div className="font-semibold text-deep-blue">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Values Section */}
        <Card className="bg-gradient-to-r from-gray-50 to-white">
          <CardContent className="p-12">
            <h2 className="text-3xl font-bold text-deep-blue text-center mb-12">Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-tech-orange rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-deep-blue mb-2">Excellence</h3>
                <p className="text-gray-600">
                  We never compromise on quality, using only premium components and meticulous assembly processes.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-tech-orange rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-deep-blue mb-2">Customer Focus</h3>
                <p className="text-gray-600">
                  Your satisfaction is our priority. We listen, understand, and deliver exactly what you need.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-tech-orange rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-deep-blue mb-2">Trust</h3>
                <p className="text-gray-600">
                  Transparent pricing, honest advice, and reliable support you can count on for years.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}