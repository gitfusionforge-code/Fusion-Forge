import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/enhanced-seo-head";
import { Link } from "wouter";
import { ChevronDown, ChevronUp, MessageCircle, Phone, Mail } from "lucide-react";
import { useBusinessSettings } from "@/hooks/use-business-settings";

export default function FAQ() {
  const [openItems, setOpenItems] = useState<number[]>([]);
  const { settings } = useBusinessSettings();

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqs = [
    {
      category: "General Questions",
      questions: [
        {
          question: "What makes FusionForge PCs different from other PC builders?",
          answer: "We focus on premium component sourcing, rigorous testing, and comprehensive warranty coverage. Every build includes professional cable management, thermal optimization, and lifetime technical support."
        },
        {
          question: "How long does it take to build a custom PC?",
          answer: "Most builds are completed within 3-7 business days. Complex configurations or specialized components may take 7-14 days. We'll provide a specific timeline with your quote."
        },
        {
          question: "Do you offer financing options?",
          answer: "Yes, we partner with leading financial institutions to offer EMI options from 6-24 months. No-cost EMI is available on purchases above ₹50,000."
        },
        {
          question: "Can I upgrade my existing PC instead of buying a new one?",
          answer: "Absolutely! We offer upgrade services including component replacements, performance optimization, and system modernization. Bring your PC for a free consultation."
        }
      ]
    },
    {
      category: "Warranty & Support",
      questions: [
        {
          question: "What does your 3-year warranty cover?",
          answer: "Our comprehensive warranty covers all components, labor, and assembly issues. This includes hardware failures, manufacturing defects, and any issues related to our assembly process."
        },
        {
          question: "How do I claim warranty service?",
          answer: "Contact our 24/7 support team via phone, email, or chat. We'll diagnose the issue remotely when possible or arrange for pickup and repair at our facility."
        },
        {
          question: "Do you provide on-site support?",
          answer: "Yes, we offer on-site support for enterprise customers and premium builds. Home users can access remote support and our pickup/delivery service."
        },
        {
          question: "What happens if a component fails after warranty?",
          answer: "We offer post-warranty support at competitive rates. Our lifetime technical support continues regardless of warranty status, and we provide priority service for our customers."
        }
      ]
    },
    {
      category: "Pricing & Payment",
      questions: [
        {
          question: "How do you determine pricing for custom builds?",
          answer: "Pricing is based on component costs plus a transparent service fee. We source components at competitive rates and pass savings to customers. No hidden charges."
        },
        {
          question: "Can I change components after placing an order?",
          answer: "Yes, modifications are possible before we begin assembly. Changes may affect pricing and delivery timeline. Contact us immediately if you need to make changes."
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major payment methods including credit/debit cards, UPI, bank transfers, and EMI options. A 30% advance is required to begin component sourcing."
        },
        {
          question: "Do you offer price matching?",
          answer: "We offer competitive pricing and will match legitimate quotes from authorized dealers. Our value includes assembly, testing, warranty, and support services."
        }
      ]
    },
    {
      category: "Technical Questions",
      questions: [
        {
          question: "Do you overclock systems by default?",
          answer: "We apply conservative overclocking only when requested and suitable for the configuration. All overclocking is thoroughly tested for stability and temperature management."
        },
        {
          question: "What operating system do you install?",
          answer: "We install Windows 11 Pro by default, but we also support Linux distributions and can accommodate specific OS requirements. All drivers and essential software are included."
        },
        {
          question: "How do you ensure component compatibility?",
          answer: "Our experts verify all component compatibility including power requirements, physical fit, and performance bottlenecks. We use professional testing tools to validate configurations."
        },
        {
          question: "Can you help with software and driver updates?",
          answer: "Yes, we provide initial software setup and driver installation. Our support team can assist with updates and provide guidance on system maintenance."
        }
      ]
    },
    {
      category: "Shipping & Delivery",
      questions: [
        {
          question: "How do you package and ship completed builds?",
          answer: "Systems are packaged in custom foam inserts and anti-static materials. We use specialized PC shipping boxes and insure all shipments. Local delivery available in major cities."
        },
        {
          question: "What if my PC is damaged during shipping?",
          answer: "All shipments are fully insured and tracked. In the rare event of shipping damage, we'll repair or replace the system at no cost and expedite delivery."
        },
        {
          question: "Can I pick up my PC directly?",
          answer: "Yes, pickup is available from our facility. We'll demonstrate the system and provide a complete walkthrough of your new PC's features and capabilities."
        },
        {
          question: "Do you ship internationally?",
          answer: "Currently, we serve customers within India. International shipping may be available for enterprise orders - contact us for specific requirements."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-light-grey py-16">
      <SEOHead 
        title="Frequently Asked Questions - FusionForge PCs"
        description="Get answers to common questions about our PC building services, warranty, pricing, and support. Expert guidance for custom computer builds."
        keywords="PC building FAQ, custom computer questions, warranty information, technical support"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-deep-blue mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions about our services, warranty, and support
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => (
            <Card key={categoryIndex}>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-deep-blue">
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {category.questions.map((faq, faqIndex) => {
                  const itemIndex = categoryIndex * 100 + faqIndex;
                  const isOpen = openItems.includes(itemIndex);
                  
                  return (
                    <Collapsible key={faqIndex} open={isOpen} onOpenChange={() => toggleItem(itemIndex)}>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                          <h3 className="text-left font-semibold text-gray-800">{faq.question}</h3>
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 text-tech-orange flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-tech-orange flex-shrink-0" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-4 text-gray-600 leading-relaxed">
                          {faq.answer}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Section */}
        <Card className="mt-16 bg-gradient-to-r from-deep-blue to-bright-blue text-white">
          <CardContent className="p-12 text-center">
            <MessageCircle className="h-16 w-16 text-tech-orange mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Can't find the answer you're looking for? Our expert team is here to help with personalized assistance.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <Phone className="h-8 w-8 text-tech-orange mx-auto mb-2" />
                <div className="font-semibold">Call Us</div>
                <div className="text-sm opacity-90">{settings.businessPhone}</div>
              </div>
              <div className="text-center">
                <Mail className="h-8 w-8 text-tech-orange mx-auto mb-2" />
                <div className="font-semibold">Email Support</div>
                <div className="text-sm opacity-90">{settings.businessEmail}</div>
              </div>
              <div className="text-center">
                <MessageCircle className="h-8 w-8 text-tech-orange mx-auto mb-2" />
                <div className="font-semibold">Live Chat</div>
                <div className="text-sm opacity-90">Available 24/7</div>
              </div>
            </div>
            <Link href="/contact">
              <Button className="bg-tech-orange hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold">
                Contact Our Experts
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}