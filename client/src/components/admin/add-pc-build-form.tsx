import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const addPcBuildSchema = z.object({
  name: z.string().min(1, "Build name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  basePrice: z.number().min(1, "Price must be greater than 0"),
  budgetRange: z.string().min(1, "Budget range is required"),
  stockQuantity: z.number().min(0, "Stock quantity cannot be negative"),
  buildType: z.string().min(1, "Build type is required"),
  profitMargin: z.number().min(0, "Profit margin cannot be negative"),
  totalPrice: z.number().min(1, "Total price must be greater than 0"),
  // Basic Specifications (matching database schema exactly)
  processor: z.string().min(1, "Processor is required"),
  gpu: z.string().optional(),
  ram: z.string().min(1, "RAM is required"),
  storage: z.string().min(1, "Storage is required"),
  motherboard: z.string().min(1, "Motherboard is required"),
  casePsu: z.string().min(1, "Case/PSU is required"),
  // Peripherals (for Full Set builds)
  monitor: z.string().optional(),
  keyboardMouse: z.string().optional(),
  mousePad: z.string().optional(),
  // Optional fields
  imageUrl: z.string().optional()
});

type AddPcBuildFormData = z.infer<typeof addPcBuildSchema>;

export default function AddPcBuildForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<AddPcBuildFormData>({
    resolver: zodResolver(addPcBuildSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      basePrice: 0,
      budgetRange: "",
      stockQuantity: 10,
      buildType: "",
      profitMargin: 0,
      totalPrice: 0,
      processor: "",
      gpu: "",
      ram: "",
      storage: "",
      motherboard: "",
      casePsu: "",
      monitor: "",
      keyboardMouse: "",
      mousePad: "",
      imageUrl: ""
    }
  });

  const addBuildMutation = useMutation({
    mutationFn: async (buildData: AddPcBuildFormData) => {
      const response = await fetch('/api/builds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add PC build');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/builds'] });
      toast({
        title: "Success",
        description: "PC build added successfully to inventory.",
      });
      form.reset();
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add PC build. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });

  const onSubmit = (data: AddPcBuildFormData) => {
    setIsSubmitting(true);
    addBuildMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Build Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Gaming Beast Pro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Student Essentials" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe this PC build configuration..."
                  className="resize-none"
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="basePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Price (₹)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="50000"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="profitMargin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profit Margin (₹)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="5000"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="totalPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Price (₹)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="55000"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="budgetRange"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget Range</FormLabel>
                <FormControl>
                  <Input placeholder="₹40,000 - ₹60,000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="buildType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Build Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select build type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CPU Only">CPU Only</SelectItem>
                    <SelectItem value="Full Set">Full Set</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="stockQuantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stock Quantity</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0"
                  placeholder="10"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Basic Specifications Section */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Specifications</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="processor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Processor</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Intel Core i5-13400F" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gpu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GPU (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., NVIDIA RTX 4060" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RAM</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 16GB DDR4 3200MHz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="storage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 500GB NVMe SSD" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motherboard"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motherboard</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., MSI B550M PRO-VDH WiFi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="casePsu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Case/PSU</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Mid Tower ATX Case with 650W PSU" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Peripherals Section (for Full Set builds) */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Peripherals (Full Set Only)</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="monitor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monitor (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 24'' 1080p IPS Monitor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keyboardMouse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keyboard & Mouse (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Wireless Combo Set" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="mousePad"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Mouse Pad (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., RGB Gaming Mouse Pad" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isSubmitting}
          >
            Reset Form
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-deep-blue to-tech-orange text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Build...
              </>
            ) : (
              'Add PC Build'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}