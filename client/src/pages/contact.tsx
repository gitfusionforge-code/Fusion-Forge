import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertInquirySchema } from "@shared/schema";
import SEOHead from "@/components/enhanced-seo-head";
import { trackQuoteRequest } from "@/components/analytics-tracker";
import { SendHorizontal } from "lucide-react";
import { z } from "zod";
import fusionForgeLogo from "@assets/Fusion Forge Logo_1750928679404.png";

const formSchema = insertInquirySchema.extend({
  name: z.string().min(1, "Full name is required").min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  budget: z.string().min(1, "Budget range is required"),
  useCase: z.string().min(1, "Primary use case is required"),
  details: z.string().min(1, "Project details are required").min(10, "Please provide more details (at least 10 characters)"),
  acceptEmails: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export default function Contact() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      budget: "",
      useCase: "",
      details: "",
      acceptEmails: false,
    },
  });

  const submitInquiry = useMutation({
    mutationFn: async (data: Omit<FormData, "acceptEmails">) => {
      const response = await apiRequest("POST", "/api/inquiries", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quote Request Submitted!",
        description: "Thank you for your quote request! We'll get back to you within 24 hours.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit your quote request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const { acceptEmails, ...inquiryData } = data;
    
    // Track analytics event
    trackQuoteRequest(data.budget, data.useCase);
    
    submitInquiry.mutate(inquiryData);
  };

  return (
    <div className="min-h-screen bg-light-grey py-16">
      <SEOHead 
        title="Get Custom PC Quote"
        description="Request a custom PC build quote tailored to your needs and budget. Professional consultation and personalized computer configurations."
        keywords="custom PC quote, computer consultation, custom build request, PC configuration"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src={fusionForgeLogo}
              alt="FusionForge PCs Logo"
              className="w-32 h-32 object-contain drop-shadow-lg"
            />
          </div>
          <h2 className="text-2xl lg:text-3xl font-semibold text-deep-blue mb-4">
            Get Your Custom Quote
          </h2>
          <p className="text-lg text-gray-600">
            Tell us about your project and we'll create the perfect PC for your needs
          </p>
        </div>

        <Card className="bg-white rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-deep-blue">Custom PC Quote Request</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <span className="font-semibold">All fields marked with </span>
                <span className="text-red-500 font-bold">*</span>
                <span className="font-semibold"> are required to process your quote request.</span>
              </p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-dark-slate">
                          Full Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your name"
                            className="border-gray-300 focus:ring-tech-orange focus:border-tech-orange"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-dark-slate">
                          Email Address <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            className="border-gray-300 focus:ring-tech-orange focus:border-tech-orange"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-dark-slate">
                          Budget Range <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:ring-tech-orange focus:border-tech-orange">
                              <SelectValue placeholder="Select budget range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="50000-80000">₹50,000 - ₹80,000 (Budget)</SelectItem>
                            <SelectItem value="80000-150000">₹80,000 - ₹1,50,000 (Mid-Range)</SelectItem>
                            <SelectItem value="150000-300000">₹1,50,000 - ₹3,00,000 (High-End)</SelectItem>
                            <SelectItem value="300000+">₹3,00,000+ (Premium)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="useCase"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-dark-slate">
                          Primary Use Case <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:ring-tech-orange focus:border-tech-orange">
                              <SelectValue placeholder="Select primary use" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="gaming">Gaming</SelectItem>
                            <SelectItem value="content-creation">Content Creation</SelectItem>
                            <SelectItem value="workstation">Professional Workstation</SelectItem>
                            <SelectItem value="office">Office/General Use</SelectItem>
                            <SelectItem value="ai-ml">AI/Machine Learning</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-dark-slate">
                        Project Details <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="Tell us about your specific requirements, preferred components, or any special needs..."
                          className="border-gray-300 focus:ring-tech-orange focus:border-tech-orange"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acceptEmails"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-tech-orange data-[state=checked]:border-tech-orange"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm text-gray-600">
                          I agree to receive follow-up emails about my custom PC quote
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={submitInquiry.isPending}
                  className="w-full bg-tech-orange text-white py-4 rounded-lg font-semibold text-lg hover:bg-orange-600 transition-colors"
                >
                  {submitInquiry.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <SendHorizontal className="mr-2 h-4 w-4" />
                      Submit Quote Request
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
