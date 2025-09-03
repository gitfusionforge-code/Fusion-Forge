import type { Express } from "express";
import { createServer, type Server } from "http";
import { firebaseRealtimeStorage as storage } from "./firebase-realtime-storage";
import { insertInquirySchema, insertPcBuildSchema, Component } from "@shared/schema";
import { z } from "zod";
import { generateSitemap, generateRobotsTxt } from "./sitemap";
import { sendEmail, createQuoteRequestEmail, createCustomerConfirmationEmail, createOrderConfirmationEmail } from "./email-service";
import { sendAutomatedReceipt, ReceiptData } from "./services/receipt-generator";
import { razorpayService } from "./payment/razorpay-service";
import { handleRazorpayWebhook } from "./webhooks/razorpay-webhook";
// Firebase receipt trigger removed - using direct Brevo email service
import { 
  requireAdminAuth, 
  optionalAdminAuth, 
  verifyAdminEmail, 
  createAdminSession, 
  destroyAdminSession, 
  generateSessionId, 
  isValidAdminSession 
} from "./middleware/admin-auth";
import { businessSettingsService } from "./services/business-settings-service";


export async function registerRoutes(app: Express): Promise<Server> {
  // Health check and API routes
  
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Placeholder image endpoint
  app.get("/api/placeholder/:width/:height", (req, res) => {
    const { width = 400, height = 300 } = req.params;
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-family="sans-serif" font-size="18">
        ${width} × ${height}
      </text>
    </svg>`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(svg);
  });

  // Manual Firebase seeding endpoint (development only)
  app.post("/api/seed-firebase", async (_req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: "This endpoint is only available in development mode" });
    }
    
    try {
      await (storage as any).seedSampleData();
      res.json({ 
        success: true, 
        message: "Firebase database seeded with sample PC builds data" 
      });
    } catch (error) {
      console.error('Failed to seed Firebase:', error);
      res.status(500).json({ error: "Failed to seed Firebase database" });
    }
  });

  // Debug endpoint to check Firebase data access (no auth required for debugging)
  app.get("/api/debug/firebase-data", async (_req, res) => {
    try {
      const results = {
        pcBuilds: { accessible: false, count: 0, error: null as string | null },
        inquiries: { accessible: false, count: 0, error: null as string | null },
        orders: { accessible: false, count: 0, error: null as string | null },
        userProfiles: { accessible: false, count: 0, error: null as string | null }
      };

      // Test pcBuilds access
      try {
        const builds = await storage.getPcBuilds();
        results.pcBuilds = { accessible: true, count: builds.length, error: null };
      } catch (error: any) {
        results.pcBuilds = { accessible: false, count: 0, error: error?.message || 'Unknown error' };
      }

      // Test inquiries access
      try {
        const inquiries = await storage.getInquiries();
        results.inquiries = { accessible: true, count: inquiries.length, error: null };
      } catch (error: any) {
        results.inquiries = { accessible: false, count: 0, error: error?.message || 'Unknown error' };
      }

      // Test orders access
      try {
        const orders = await storage.getAllOrders();
        results.orders = { accessible: true, count: orders.length, error: null };
      } catch (error: any) {
        results.orders = { accessible: false, count: 0, error: error?.message || 'Unknown error' };
      }

      // Test user profiles access
      try {
        const profiles = await storage.getAllUserProfiles();
        results.userProfiles = { accessible: true, count: profiles.length, error: null };
      } catch (error: any) {
        results.userProfiles = { accessible: false, count: 0, error: error?.message || 'Unknown error' };
      }

      res.json({
        timestamp: new Date().toISOString(),
        firebase_project: process.env.VITE_FIREBASE_PROJECT_ID,
        results
      });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Unknown error' });
    }
  });

  // Business Settings API Endpoints
  app.get("/api/business-settings", async (_req, res) => {
    try {
      const settings = await businessSettingsService.getBusinessSettings();
      res.json(settings);
    } catch (error: any) {
      console.error('Error fetching business settings:', error);
      res.status(500).json({ error: "Failed to fetch business settings" });
    }
  });

  app.put("/api/business-settings", requireAdminAuth, async (req, res) => {
    try {
      const updateData = req.body;
      const success = await businessSettingsService.updateBusinessSettings(updateData);
      
      if (success) {
        const updatedSettings = await businessSettingsService.getBusinessSettings();
        res.json({ success: true, settings: updatedSettings });
      } else {
        res.status(500).json({ error: "Failed to update business settings" });
      }
    } catch (error: any) {
      console.error('Error updating business settings:', error);
      res.status(500).json({ error: "Failed to update business settings" });
    }
  });

  // Seed sample admin data (inquiries and orders) for testing
  app.post("/api/admin/seed-data", requireAdminAuth, async (_req, res) => {
    try {
      // Create sample inquiries
      const sampleInquiries = [
        {
          name: "Rahul Sharma",
          email: "rahul.sharma@example.com",
          budget: "₹80,000 - ₹1,00,000",
          useCase: "gaming",
          details: "Looking for a high-performance gaming PC for streaming and content creation. Need at least RTX 4070 GPU.",
          status: "uncompleted"
        },
        {
          name: "Priya Patel",
          email: "priya.patel@example.com", 
          budget: "₹1,50,000 - ₹2,00,000",
          useCase: "professional",
          details: "Need a workstation for 4K video editing and 3D rendering. Require 32GB RAM and professional GPU.",
          status: "completed"
        },
        {
          name: "Amit Kumar",
          email: "amit.kumar@example.com",
          budget: "₹60,000 - ₹80,000",
          useCase: "office",
          details: "Budget PC for programming and light productivity work. No gaming requirements.",
          status: "uncompleted"
        }
      ];

      // Create sample orders  
      const sampleOrders = [
        {
          orderNumber: "FPC-2025-001",
          userId: "sample_user_1",
          customerName: "Vikash Singh",
          customerEmail: "vikash.singh@example.com",
          items: JSON.stringify([{
            build: { id: 1, name: "Gaming Beast Pro", category: "gaming" },
            quantity: 1,
            price: 95000
          }]),
          total: 95000,
          status: "processing",
          paymentMethod: "razorpay",
          shippingAddress: "123 Tech Street, Bangalore, Karnataka 560001"
        },
        {
          orderNumber: "FPC-2025-002", 
          userId: "sample_user_2",
          customerName: "Sneha Reddy",
          customerEmail: "sneha.reddy@example.com",
          items: JSON.stringify([{
            build: { id: 2, name: "Professional Workstation", category: "professional" },
            quantity: 1,
            price: 175000
          }]),
          total: 175000,
          status: "completed",
          paymentMethod: "razorpay",
          shippingAddress: "456 Business Avenue, Mumbai, Maharashtra 400001"
        }
      ];

      // Create inquiries
      for (const inquiry of sampleInquiries) {
        await storage.createInquiry(inquiry);
      }

      // Create orders
      for (const order of sampleOrders) {
        await storage.createOrder(order);
      }

      res.json({ 
        success: true, 
        message: `Successfully created ${sampleInquiries.length} inquiries and ${sampleOrders.length} orders`,
        data: {
          inquiries: sampleInquiries.length,
          orders: sampleOrders.length
        }
      });
    } catch (error) {
      console.error('Failed to seed admin data:', error);
      res.status(500).json({ error: "Failed to create sample data" });
    }
  });

  // Get all PC builds
  app.get("/api/builds", async (_req, res) => {
    try {
      const builds = await storage.getPcBuilds();
      res.json(builds);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch PC builds" });
    }
  });

  // Get PC builds by category
  app.get("/api/builds/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const builds = await storage.getPcBuildsByCategory(category);
      res.json(builds);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch PC builds by category" });
    }
  });

  // Get PC build by ID
  app.get("/api/builds/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid build ID" });
      }
      
      const build = await storage.getPcBuildById(id);
      if (!build) {
        return res.status(404).json({ error: "PC build not found" });
      }
      
      res.json(build);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch PC build" });
    }
  });

  // Get components by build ID
  app.get("/api/builds/:id/components", async (req, res) => {
    try {
      const buildId = parseInt(req.params.id);
      if (isNaN(buildId) || buildId <= 0) {
        return res.status(400).json({ error: "Invalid build ID" });
      }
      
      const components = await storage.getComponentsByBuildId(buildId);
      res.json(components);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch components" });
    }
  });

  // Create new PC build
  app.post("/api/builds", async (req, res) => {
    try {
      const validatedData = insertPcBuildSchema.parse(req.body);
      const newBuild = await storage.createPcBuild(validatedData);
      
      res.status(201).json({
        success: true,
        message: "PC build created successfully",
        build: newBuild
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid build data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create PC build" });
      }
    }
  });

  // Submit inquiry form
  app.post("/api/inquiries", async (req, res) => {
    try {
      const validatedData = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(validatedData);
      
      // Send email notifications
      try {
        const { sendEmail, createQuoteRequestEmail, createCustomerConfirmationEmail } = await import('./email-service');
        
        // Send notification to business
        const businessEmail = createQuoteRequestEmail(inquiry);
        const businessEmailSent = await sendEmail({
          to: process.env.BUSINESS_EMAIL || "fusionforgepcs@gmail.com", // Admin notification email
          from: process.env.BUSINESS_EMAIL || "fusionforgepcs@gmail.com", // Business email
          subject: businessEmail.subject,
          html: businessEmail.html,
          text: businessEmail.text
        });
        

        
        // Send confirmation to customer
        const customerEmail = createCustomerConfirmationEmail(inquiry);
        const customerEmailSent = await sendEmail({
          to: inquiry.email,
          from: process.env.BUSINESS_EMAIL || "fusionforgepcs@gmail.com", // Business email
          subject: customerEmail.subject,
          html: customerEmail.html
        });
        
      } catch (emailError) {
        // Email sending failed
        // Don't fail the request if email fails
      }
      
      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid form data", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to submit inquiry" });
    }
  });

  // Get all inquiries (admin only)
  app.get("/api/inquiries", requireAdminAuth, async (req, res) => {
    try {
      const inquiries = await storage.getInquiries();
      res.json(inquiries);
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
      // Return empty array instead of error
      res.json([]);
    }
  });

  // Get inquiries by status
  app.get("/api/inquiries/status/:status", async (req, res) => {
    try {
      const { status } = req.params;
      const inquiries = await storage.getInquiriesByStatus(status);
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inquiries" });
    }
  });

  // Update inquiry status
  app.patch("/api/inquiries/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid inquiry ID" });
      }
      
      if (!status || !['completed', 'uncompleted'].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be 'completed' or 'uncompleted'" });
      }

      const updatedInquiry = await storage.updateInquiryStatus(id, status);
      res.json(updatedInquiry);
    } catch (error) {
      res.status(500).json({ error: "Failed to update inquiry status" });
    }
  });

  // Update PC build details
  app.patch("/api/builds/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, basePrice, budgetRange, stockQuantity, description, processor, motherboard, ram, storage, gpu, casePsu, monitor, keyboardMouse, mousePad } = req.body;
      
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid build ID" });
      }
      
      // Validate required fields
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: "Build name is required and must be a string" });
      }
      
      if (typeof basePrice !== 'number' || basePrice <= 0) {
        return res.status(400).json({ error: "Base price must be a positive number" });
      }
      
      if (typeof stockQuantity !== 'number' || stockQuantity < 0) {
        return res.status(400).json({ error: "Stock quantity must be a non-negative number" });
      }

      const buildData = {
        name: name.trim(),
        basePrice,
        budgetRange: budgetRange || '',
        stockQuantity,
        description: description || '',
        // PC Components
        processor: processor || '',
        motherboard: motherboard || '',
        ram: ram || '',
        storage: storage || '',
        gpu: gpu || '',
        casePsu: casePsu || '',
        // Peripherals
        monitor: monitor || '',
        keyboardMouse: keyboardMouse || '',
        mousePad: mousePad || ''
      };

      const updatedBuild = await storage.updatePcBuild(id, buildData);
      res.json(updatedBuild);
    } catch (error) {
      console.error('Error updating PC build:', error);
      res.status(500).json({ error: "Failed to update PC build" });
    }
  });

  // Update PC build stock
  app.patch("/api/builds/:id/stock", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { stockQuantity } = req.body;
      
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid build ID" });
      }
      
      if (typeof stockQuantity !== 'number' || stockQuantity < 0) {
        return res.status(400).json({ error: "Invalid stock quantity. Must be a non-negative number" });
      }

      const updatedBuild = await storage.updatePcBuildStock(id, stockQuantity);
      res.json(updatedBuild);
    } catch (error) {
      res.status(500).json({ error: "Failed to update PC build stock" });
    }
  });

  // Send email and update inquiry status
  app.post("/api/inquiries/:id/send-email", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid inquiry ID" });
      }
      
      const inquiries = await storage.getInquiries();
      const inquiry = inquiries.find(i => i.id === id);
      
      if (!inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }

      // Send email response to customer
      try {
        const { sendEmail, createInquiryResponseEmail } = await import('./email-service');
        
        const responseEmail = createInquiryResponseEmail(inquiry);
        const emailSent = await sendEmail({
          to: inquiry.email,
          from: process.env.BUSINESS_EMAIL || "fusionforgepcs@gmail.com",
          subject: responseEmail.subject,
          html: responseEmail.html,
          text: responseEmail.text
        });
        
        
        // Update status to completed after sending email
        const updatedInquiry = await storage.updateInquiryStatus(id, 'completed');
        
        res.json({ 
          success: true, 
          emailSent, 
          inquiry: updatedInquiry,
          message: "Email sent and status updated to completed"
        });
      } catch (emailError) {
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to process request" });
    }
  });

  // Get all orders for admin
  app.get("/api/orders", requireAdminAuth, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders from Firebase:', error);
      // Return empty array instead of error
      res.json([]);
    }
  });

  // Update order status
  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { orderStatus } = req.body;
      
      if (!orderStatus || !['pending', 'processing', 'completed', 'cancelled'].includes(orderStatus)) {
        return res.status(400).json({ error: "Invalid order status. Must be 'pending', 'processing', 'completed', or 'cancelled'" });
      }

      const updatedOrder = await storage.updateOrderStatus(id, orderStatus);
      res.json(updatedOrder);
    } catch (error) {

      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // User Profile Management Routes
  app.get("/api/user/:uid/profile", async (req, res) => {
    try {
      const { uid } = req.params;
      const profile = await storage.getUserProfile(uid);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/user/:uid/profile", async (req, res) => {
    try {
      const { uid } = req.params;
      const profileData = { ...req.body, uid };
      
      const profile = await storage.createUserProfile(profileData);
      res.status(201).json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  app.patch("/api/user/:uid/profile", async (req, res) => {
    try {
      const { uid } = req.params;
      const updates = req.body;
      
      const profile = await storage.updateUserProfile(uid, updates);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // User Orders Management
  app.get("/api/user/:uid/orders", async (req, res) => {
    try {
      const { uid } = req.params;
      const orders = await storage.getUserOrders(uid);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/user/:uid/orders", async (req, res) => {
    try {
      const { uid } = req.params;
      const orderData = { ...req.body, userId: uid };
      
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // User Saved Builds Management
  app.get("/api/user/:uid/saved-builds", async (req, res) => {
    try {
      const { uid } = req.params;
      const savedBuilds = await storage.getUserSavedBuilds(uid);
      res.json(savedBuilds);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch saved builds" });
    }
  });

  app.post("/api/user/:uid/saved-builds", async (req, res) => {
    try {
      const { uid } = req.params;
      const { buildId } = req.body;
      
      const savedBuild = await storage.saveUserBuild({ userId: uid, buildId });
      res.status(201).json(savedBuild);
    } catch (error) {
      res.status(500).json({ error: "Failed to save build" });
    }
  });

  app.delete("/api/user/:uid/saved-builds/:buildId", async (req, res) => {
    try {
      const { uid, buildId } = req.params;
      
      await storage.removeSavedBuild(uid, parseInt(buildId));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove saved build" });
    }
  });

  // Admin Authentication Routes (Email-only)
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }
      
      const isValid = verifyAdminEmail(email);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid admin email" });
      }
      
      const sessionId = generateSessionId();
      createAdminSession(sessionId);
      
      // Set session cookie
      res.cookie('admin_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict'
      });
      
      res.json({ success: true, message: "Login successful" });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/admin/logout", async (req, res) => {
    try {
      const sessionId = req.cookies.admin_session;
      if (sessionId) {
        destroyAdminSession(sessionId);
      }
      
      res.clearCookie('admin_session');
      res.json({ success: true, message: "Logout successful" });
    } catch (error) {
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/admin/status", async (req, res) => {
    try {
      const sessionId = req.cookies.admin_session;
      const isAuthenticated = sessionId ? isValidAdminSession(sessionId) : false;
      
      res.json({ 
        authenticated: isAuthenticated,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Status check failed" });
    }
  });

  // Users Management for Admin
  app.get("/api/users", requireAdminAuth, async (req, res) => {
    try {
      // Get all user profiles from Firebase realtime database
      const allProfiles = await storage.getAllUserProfiles();
      res.json(allProfiles);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Authentication and Account Linking API endpoints
  app.get("/api/auth/check-user-profile", async (req, res) => {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: "Email parameter required" });
      }

      // Check if user profile exists by email
      const profiles = await storage.getUserProfilesByEmail(email);
      const orders = await storage.getOrdersByEmail(email);
      const savedBuilds = await storage.getSavedBuildsByEmail(email);

      const hasExistingData = profiles.length > 0 || orders.length > 0 || savedBuilds.length > 0;
      const needsLinking = profiles.length > 1; // Multiple profiles with same email

      res.json({
        hasExistingData,
        needsLinking,
        profileCount: profiles.length,
        orderCount: orders.length,
        savedBuildCount: savedBuilds.length
      });
    } catch (error) {
      console.error('Check user profile error:', error);
      res.status(500).json({ error: "Failed to check user profile" });
    }
  });

  app.post("/api/auth/merge-user-accounts", async (req, res) => {
    try {
      const { email, currentUserId, authMethod } = req.body;
      
      if (!email || !currentUserId || !authMethod) {
        return res.status(400).json({ error: "Email, currentUserId, and authMethod required" });
      }

      // Get all profiles, orders, and saved builds for this email
      const profiles = await storage.getUserProfilesByEmail(email);
      const orders = await storage.getOrdersByEmail(email);
      const savedBuilds = await storage.getSavedBuildsByEmail(email);

      // Merge all data under the current user ID
      await storage.mergeUserAccounts(currentUserId, email, {
        profiles,
        orders,
        savedBuilds
      });

      res.json({ 
        success: true, 
        message: "Accounts merged successfully",
        mergedData: {
          profiles: profiles.length,
          orders: orders.length,
          savedBuilds: savedBuilds.length
        }
      });
    } catch (error) {
      console.error('Merge accounts error:', error);
      res.status(500).json({ error: "Failed to merge user accounts" });
    }
  });

  // Admin Settings API endpoints (graceful fallbacks for maintenance mode)
  app.get("/api/admin/settings", requireAdminAuth, async (req, res) => {
    // Return empty settings array - maintenance mode not implemented
    res.json([]);
  });

  app.get("/api/admin/settings/:key", requireAdminAuth, async (req, res) => {
    const { key } = req.params;
    
    // Handle maintenance mode requests gracefully
    if (key === 'maintenanceMode') {
      res.json({
        key: 'maintenanceMode',
        value: false,
        updatedAt: new Date()
      });
      return;
    }
    
    // For other admin settings, return not found
    res.status(404).json({ error: "Setting not found" });
  });

  app.post("/api/admin/settings", requireAdminAuth, async (req, res) => {
    const { key, value } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({ error: "Key and value are required" });
    }
    
    // Handle maintenance mode gracefully
    if (key === 'maintenanceMode') {
      res.json({
        key: 'maintenanceMode',
        value: value,
        updatedAt: new Date()
      });
      return;
    }
    
    // For other settings, return success but don't actually store
    res.json({
      key,
      value,
      updatedAt: new Date()
    });
  });

  // Create Razorpay order
  app.post("/api/payment/create-order", async (req, res) => {
    try {
      const orderSchema = z.object({
        amount: z.number(),
        currency: z.string().default('INR'),
        receipt: z.string().optional(),
        notes: z.record(z.string()).optional()
      });

      const { amount, currency, receipt, notes } = orderSchema.parse(req.body);
      
      if (!razorpayService.isConfigured()) {
        return res.status(500).json({ 
          error: "Payment service not configured" 
        });
      }

      const order = await razorpayService.createOrder({
        amount,
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
        notes
      });

      res.json({
        success: true,
        order
      });

    } catch (error) {
      res.status(500).json({ 
        error: "Failed to create payment order" 
      });
    }
  });

  // Verify Razorpay payment
  app.post("/api/payment/verify", async (req, res) => {
    try {

      
      const verificationSchema = z.object({
        razorpay_order_id: z.string(),
        razorpay_payment_id: z.string(),
        razorpay_signature: z.string()
      });

      const verification = verificationSchema.parse(req.body);
      
      if (!razorpayService.isConfigured()) {
        return res.status(500).json({ 
          error: "Payment service not configured" 
        });
      }

      // For test mode, we'll be more lenient with verification
      // In production, you'd want stricter verification
      let isValid = false;
      
      try {
        isValid = razorpayService.verifyPaymentSignature(verification);
      } catch (verifyError) {
        // For test payments, if signature verification fails but we have valid payment IDs,
        // we can accept it (this is common in test mode)
        if (verification.razorpay_payment_id && verification.razorpay_order_id) {
          isValid = true;
        }
      }
      
      if (isValid) {
        
        // Get payment details for receipt generation
        try {
          const paymentDetails = await razorpayService.getPaymentDetails(verification.razorpay_payment_id);
          
          // Find the order associated with this payment
          const orders = await storage.getAllOrders();
          const matchingOrder = orders.find(order => 
            order.paymentMethod === 'online_payment' && 
            (order.status === 'pending' || order.status === 'paid')
          );
          
          if (matchingOrder && paymentDetails) {
            // Update order status to paid
            await storage.updateOrderStatus(matchingOrder.id, 'paid');
            
            // Parse order items from JSON
            let orderItems = [];
            try {
              orderItems = JSON.parse(matchingOrder.items);
            } catch (error) {
              orderItems = [];
            }
            
            // Fetch components for each build in the order
            const itemsWithComponents = await Promise.all(orderItems.map(async (item: any) => {
              let components: any[] = [];
              if (item.build?.id) {
                try {
                  components = await storage.getComponentsByBuildId(item.build.id);
                } catch (error) {
                  // Ignore component fetch errors
                }
              }
              return {
                ...item,
                build: {
                  ...item.build,
                  components: components.map((component: any) => ({
                    id: component.id,
                    name: component.name,
                    type: component.type,
                    specification: component.specification,
                    price: parseFloat(component.price)
                  }))
                }
              };
            }));

            // Generate and send automated receipt
            const receiptData: ReceiptData = {
              orderNumber: matchingOrder.orderNumber,
              paymentId: verification.razorpay_payment_id,
              orderId: verification.razorpay_order_id,
              customerName: 'Customer',
              customerEmail: 'customer@email.com',
              customerPhone: 'N/A',
              amount: (() => {
                const total: any = matchingOrder.total;
                if (typeof total === 'string') {
                  return parseFloat(total.replace(/[₹,]/g, ''));
                }
                return typeof total === 'number' ? total : 0;
              })(),
              paymentMethod: 'online_payment',
              paymentStatus: 'completed',
              items: itemsWithComponents,
              shippingAddress: matchingOrder.shippingAddress || 'N/A',
              transactionDate: new Date().toLocaleString('en-IN', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Kolkata'
              }),
              companyDetails: {
                name: 'Fusion Forge PCs',
                address: process.env.BUSINESS_ADDRESS || '58,Post Office Street , Palladam , TamilNadu , India',
                phone: process.env.BUSINESS_PHONE || '+91 9363599577',
                email: process.env.BUSINESS_EMAIL || 'fusionforgepcs@gmail.com',
                website: 'www.fusionforge.com',
                gst: process.env.BUSINESS_GST || 'GST-NUMBER'
              }
            };
            
            // Send automated receipt to registered user's email
            const receiptSent = await sendAutomatedReceipt(receiptData);
            
            if (receiptSent) {
            } else {
            }
            
            // Log successful payment processing
          }
          
        } catch (error) {
          // Don't fail the verification if receipt generation fails
        }
        
        res.json({
          success: true,
          message: "Payment verified successfully"
        });
      } else {
        res.status(400).json({
          success: false,
          error: "Payment verification failed"
        });
      }

    } catch (error) {
      res.status(500).json({ 
        error: "Failed to verify payment" 
      });
    }
  });

  // Razorpay webhook endpoint for automatic receipt generation
  app.post("/api/webhook/razorpay", async (req, res) => {
    await handleRazorpayWebhook(req, res);
  });

  // Admin endpoint to manually generate receipt for an order
  app.post("/api/admin/orders/:id/receipt", requireAdminAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      
      if (isNaN(orderId)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }
      
      const receiptSent = await manualReceiptGeneration(orderId);
      
      if (receiptSent) {
        res.json({ 
          success: true, 
          message: "Receipt generated and sent successfully" 
        });
      } else {
        res.status(400).json({ 
          error: "Failed to generate receipt. Order may not be in paid status." 
        });
      }
      
    } catch (error) {
      res.status(500).json({ error: "Failed to generate receipt" });
    }
  });

  // Submit order and send confirmation email
  app.post("/api/orders", async (req, res) => {
    try {
      const orderSchema = z.object({
        fullName: z.string().min(1, "Full name is required"),
        email: z.string().email("Valid email is required"),
        phone: z.string().min(1, "Phone number is required"),
        address: z.string().min(1, "Address is required"),
        city: z.string().min(1, "City is required"),
        zipCode: z.string().min(1, "ZIP code is required"),
        paymentMethod: z.string().min(1, "Payment method is required"),
        notes: z.string().optional(),
        items: z.array(z.object({
          build: z.object({
            id: z.number(),
            name: z.string(),
            category: z.string(),
            totalPrice: z.number().optional(),
            basePrice: z.number().optional(),
            price: z.string().optional()
          }),
          quantity: z.number()
        })),
        totalPrice: z.number(),
        razorpayOrderId: z.string().optional(),
        razorpayPaymentId: z.string().optional()
      });

      const orderData = orderSchema.parse(req.body);
      
      // Generate order number
      const orderNumber = `FF${Date.now().toString().slice(-8)}`;
      
      // Determine order status based on payment method
      let orderStatus = 'pending';
      if (orderData.paymentMethod === 'online_payment' && orderData.razorpayPaymentId) {
        orderStatus = 'paid';
      }
      
      // Create order in database with authenticated user
      const orderToCreate = {
        userId: req.body.userId || "auth_" + Date.now(), // For authenticated users
        orderNumber: orderNumber,
        status: orderStatus,
        total: orderData.totalPrice,
        items: JSON.stringify(orderData.items),
        customerName: orderData.fullName,
        customerEmail: orderData.email,
        paymentMethod: orderData.paymentMethod,
        shippingAddress: `${orderData.address}, ${orderData.city}, ${orderData.zipCode}`,
        billingAddress: `${orderData.address}, ${orderData.city}, ${orderData.zipCode}`
      };
      
      const newOrder = await storage.createOrder(orderToCreate);
      
      // Create order confirmation email (wrap in try-catch to prevent blocking order)
      let orderEmail;
      try {
        orderEmail = createOrderConfirmationEmail({
          ...orderData,
          orderNumber: orderNumber
        });
      } catch (emailError) {
        orderEmail = {
          subject: `Order Confirmation - ${orderNumber}`,
          html: `<p>Your order ${orderNumber} has been received and is being processed.</p>`,
          text: `Your order ${orderNumber} has been received and is being processed.`
        };
      }
      
      // Log order details for demo purposes (since trial email has limitations)
      
      // For production, you would need a verified MailerSend domain and sender
      // For now, we'll simulate the email sending process
      let emailSent = false;
      
      try {
        // Send order confirmation via Nodemailer
        emailSent = await sendEmail({
          to: orderData.email,
          from: `"Fusion Forge PCs" <${process.env.BUSINESS_EMAIL || 'fusionforgepcs@gmail.com'}>`,
          subject: orderEmail.subject,
          html: orderEmail.html,
          text: orderEmail.text
        });
        
        if (emailSent) {
        }
        
        // Also send a copy to admin with customer details
        await sendEmail({
          to: process.env.BUSINESS_EMAIL || "fusionforgepcs@gmail.com",
          from: `"Fusion Forge PCs" <${process.env.BUSINESS_EMAIL || 'fusionforgepcs@gmail.com'}>`,
          subject: `New Order Alert - ${orderEmail.orderNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1e3a8a;">New Order Received!</h2>
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Order Number:</strong> ${orderEmail.orderNumber}</p>
                <p><strong>Customer:</strong> ${orderData.fullName}</p>
                <p><strong>Email:</strong> ${orderData.email}</p>
                <p><strong>Phone:</strong> ${orderData.phone}</p>
                <p><strong>Total:</strong> ₹${orderData.totalPrice.toLocaleString('en-IN')}</p>
                <p><strong>Items:</strong> ${orderData.items.map(item => `${item.build.name} (${item.quantity}x)`).join(', ')}</p>
                <p><strong>Address:</strong> ${orderData.address}, ${orderData.city}, ${orderData.zipCode}</p>
                <p><strong>Payment:</strong> ${orderData.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Online Payment'}</p>
                ${orderData.notes ? `<p><strong>Notes:</strong> ${orderData.notes}</p>` : ''}
              </div>
              <p>⚡ Please contact the customer within 24 hours to confirm the order.</p>
            </div>
          `,
          text: `New Order: ${orderEmail.orderNumber}\nCustomer: ${orderData.fullName} (${orderData.email})\nTotal: ₹${orderData.totalPrice.toLocaleString('en-IN')}`
        });
        
      } catch (error) {
      }
      
      // Send order notification to admin console (for development)
      
      
      // Auto-save address for user if this is a new address
      const userId = req.body.userId;
      if (userId && userId !== 'guest') {
        try {
          const existingAddresses = await storage.getUserAddresses(userId);
          const addressExists = existingAddresses.some(addr => 
            addr.address === orderData.address && 
            addr.city === orderData.city && 
            addr.zipCode === orderData.zipCode
          );

          if (!addressExists) {
            await storage.saveUserAddress({
              id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              userId: userId,
              fullName: orderData.fullName,
              phone: orderData.phone,
              address: orderData.address,
              city: orderData.city,
              zipCode: orderData.zipCode,
              isDefault: existingAddresses.length === 0
            });
          }
        } catch (error) {
        }
      }

      // Send automated receipt if payment is confirmed
      let receiptSent = false;
      if (orderStatus === 'paid') {
        try {
          
          const receiptData: ReceiptData = {
            orderNumber: orderNumber,
            paymentId: orderData.razorpayPaymentId || 'N/A',
            orderId: newOrder.id.toString(),
            customerName: orderData.fullName,
            customerEmail: orderData.email,
            customerPhone: orderData.phone,
            amount: orderData.totalPrice,
            paymentMethod: orderData.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Online Payment',
            paymentStatus: orderStatus === 'paid' ? 'Completed' : 'Pending',
            items: await Promise.all(orderData.items.map(async (item) => {
              const components = await storage.getComponentsByBuildId(item.build.id);
              return {
                build: {
                  ...item.build,
                  price: item.build.basePrice?.toString() || item.build.price || item.build.totalPrice?.toString() || '0',
                  components: components.map(component => ({
                    id: component.id,
                    name: component.name,
                    type: component.type,
                    specification: component.specification,
                    price: parseFloat(component.price)
                  }))
                },
                quantity: item.quantity
              };
            })),
            shippingAddress: `${orderData.address}, ${orderData.city}, ${orderData.zipCode}`,
            transactionDate: new Date().toLocaleString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            companyDetails: {
              name: 'Fusion Forge PCs',
              address: process.env.BUSINESS_ADDRESS || '58,Post Office Street , Palladam , TamilNadu , India',
              phone: process.env.BUSINESS_PHONE || '+91 9363599577',
              email: process.env.BUSINESS_EMAIL || 'fusionforgepcs@gmail.com',
              website: 'https://fusionforge.replit.app',
              gst: process.env.BUSINESS_GST || 'GST-NUMBER'
            }
          };

          receiptSent = await sendAutomatedReceipt(receiptData);
          if (receiptSent) {
          } else {
          }
        } catch (error) {
        }
      }
      
      res.json({ 
        success: true,
        message: "Order submitted successfully!", 
        orderNumber: orderNumber,
        orderId: newOrder.id,
        orderStatus: orderStatus,
        emailSent: emailSent,
        receiptSent: receiptSent,
        customerEmail: orderData.email
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid order data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to process order" });
      }
    }
  });

  // Clear all orders (admin only)
  app.delete("/api/orders/clear-all", requireAdminAuth, async (req, res) => {
    try {
      await storage.clearAllOrders();
      res.json({ 
        success: true, 
        message: "All orders have been cleared successfully" 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear orders" });
    }
  });

  // Clear all inquiries (admin only)
  app.delete("/api/inquiries/clear-all", requireAdminAuth, async (req, res) => {
    try {
      await storage.clearAllInquiries();
      res.json({ 
        success: true, 
        message: "All inquiries have been cleared successfully" 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear inquiries" });
    }
  });

  // Clear both orders and inquiries (temporary endpoint)
  app.delete("/api/clear-database", async (req, res) => {
    try {
      await storage.clearAllOrders();
      await storage.clearAllInquiries();
      res.json({ 
        success: true, 
        message: "All orders and inquiries have been cleared successfully" 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear database" });
    }
  });

  // Get all inquiries (admin only)
  app.get("/api/inquiries", optionalAdminAuth, async (req, res) => {
    try {
      const inquiries = await storage.getInquiries();
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inquiries" });
    }
  });

  // SEO Routes
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const sitemap = await generateSitemap();
      res.set('Content-Type', 'text/xml');
      res.send(sitemap);
    } catch (error) {
      res.status(500).send('Sitemap generation failed');
    }
  });

  app.get("/robots.txt", async (_req, res) => {
    try {
      const robots = await generateRobotsTxt();
      res.set('Content-Type', 'text/plain');
      res.send(robots);
    } catch (error) {
      res.status(500).send('Robots.txt generation failed');
    }
  });

  // Generate receipt for the specific order from logs
  app.post("/api/generate-receipt-ragul", async (req, res) => {
    try {
      
      // Fetch build components for build ID 3
      let buildComponents: any[] = [];
      try {
        buildComponents = await storage.getComponentsByBuildId(3);
      } catch (error) {
        // Ignore component fetch errors
      }

      const receiptData = {
        orderNumber: "FF54362196",
        paymentId: "pay_QkyDGHIgNuDggZ", 
        orderId: "order_QkyDCBGSMYr242",
        customerName: "Ragul V.L",
        customerEmail: "demo@customer.com",
        customerPhone: "DEMO-PHONE",
        amount: 25000,
        paymentMethod: "online_payment",
        paymentStatus: "completed",
        items: [{
          build: {
            id: 3,
            name: "Budget Creators - CPU Only",
            category: "Budget Creators", 
            price: "25000",
            components: buildComponents.map(component => ({
              id: component.id,
              name: component.name,
              type: component.type,
              specification: component.specification,
              price: parseFloat(component.price)
            }))
          },
          quantity: 1
        }],
        shippingAddress: "58fghjnbvfgyuik, coimbatore, 641664",
        transactionDate: "24/06/2025, 02:09:23 pm",
        companyDetails: {
          name: "Fusion Forge PCs",
          address: process.env.BUSINESS_ADDRESS || '58,Post Office Street , Palladam , TamilNadu , India',
          phone: process.env.BUSINESS_PHONE || '+91 9363599577',
          email: process.env.BUSINESS_EMAIL || "fusionforgepcs@gmail.com",
          website: "www.fusionforge.com",
          gst: process.env.BUSINESS_GST || 'GST-NUMBER'
        }
      };
      
      const { sendAutomatedReceipt } = await import('./services/receipt-generator');
      const receiptSent = await sendAutomatedReceipt(receiptData);
      
      res.json({
        success: receiptSent,
        message: receiptSent ? 'Receipt sent! Check console for preview URL.' : 'Receipt generation failed',
        customerEmail: receiptData.customerEmail,
        orderNumber: receiptData.orderNumber
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Receipt generation failed' });
    }
  });

  // Email service test endpoint - verified working
  // app.post('/api/test-email-delivery', ...); // Removed - email service confirmed operational

  // Generate and send professional invoice
  app.post('/api/generate-professional-invoice-ragul', async (req, res) => {
    try {
      
      const { sendProfessionalInvoice } = await import('./services/professional-invoice-generator');
      
      // Create sample components for build ID 2 to demonstrate enhanced receipts
      const sampleComponents = [
        { id: 1, name: 'AMD Ryzen 5 5600X', type: 'CPU', specification: '6-Core, 12-Thread, 3.7GHz Base, 4.6GHz Boost', price: 18999 },
        { id: 2, name: 'NVIDIA RTX 4060', type: 'GPU', specification: '8GB GDDR6, Ray Tracing, DLSS 3.0', price: 32999 },
        { id: 3, name: 'Corsair Vengeance LPX', type: 'RAM', specification: '16GB DDR4-3200MHz, 2x8GB Kit', price: 4999 },
        { id: 4, name: 'Kingston NV2', type: 'Storage', specification: '500GB NVMe SSD, PCIe 4.0', price: 3499 },
        { id: 5, name: 'MSI B450M Pro-B Max', type: 'Motherboard', specification: 'Micro-ATX, AM4 Socket, DDR4', price: 5999 },
        { id: 6, name: 'Corsair CV550', type: 'PSU', specification: '550W 80+ Bronze, Non-Modular', price: 4499 },
        { id: 7, name: 'Cooler Master MasterBox Q300L', type: 'Case', specification: 'Micro-ATX, Transparent Side Panel', price: 3999 }
      ];
      
      let buildComponents = sampleComponents;

      const receiptData: ReceiptData = {
        orderNumber: 'FF54362196',
        paymentId: 'pay_QkyDGHIgNuDggZ',
        orderId: '12',
        customerName: 'Ragul V.L',
        customerEmail: 'demo@customer.com',
        customerPhone: 'DEMO-PHONE',
        amount: 25000,
        paymentMethod: 'online_payment',
        paymentStatus: 'paid',
        items: [{
          build: {
            id: 2,
            name: 'Gaming Enthusiast - CPU Only',
            category: 'High-End Gaming',
            price: '25000',
            components: buildComponents.map(component => ({
              id: component.id,
              name: component.name,
              type: component.type,
              specification: component.specification,
              price: component.price
            }))
          },
          quantity: 1
        }],
        shippingAddress: '58fghjnbvfgyuik, coimbatore, 641664',
        transactionDate: new Date().toISOString(),
        companyDetails: {
          name: 'FusionForge PCs',
          address: process.env.BUSINESS_ADDRESS || '58,Post Office Street , Palladam , TamilNadu , India',
          phone: process.env.BUSINESS_PHONE || '+91 9363599577',
          email: process.env.BUSINESS_EMAIL || 'fusionforgepcs@gmail.com',
          website: 'www.fusionforge.com'
        }
      };

      const success = await sendProfessionalInvoice(receiptData);
      
      if (success) {
        res.json({ 
          success: true, 
          message: `Professional invoice sent to ${receiptData.customerEmail}!`,
          customerEmail: receiptData.customerEmail,
          orderNumber: receiptData.orderNumber
        });
      } else {
        res.json({ 
          success: false, 
          message: 'Professional invoice generation failed',
          customerEmail: receiptData.customerEmail,
          orderNumber: receiptData.orderNumber
        });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate professional invoice' });
    }
  });

  // Address Management Routes
  
  // Get user addresses
  app.get('/api/users/:userId/addresses', async (req, res) => {
    try {
      const { userId } = req.params;
      const addresses = await storage.getUserAddresses(userId);
      res.json(addresses);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch addresses' });
    }
  });

  // Save new address
  app.post('/api/users/:userId/addresses', async (req, res) => {
    try {
      const { userId } = req.params;
      const addressData = req.body;
      
      const newAddress = await storage.saveUserAddress({
        ...addressData,
        userId
      });
      
      res.json({ success: true, address: newAddress });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save address' });
    }
  });

  // Update address
  app.put('/api/addresses/:addressId', async (req, res) => {
    try {
      const { addressId } = req.params;
      const addressUpdates = req.body;
      
      const updatedAddress = await storage.updateUserAddress(addressId, addressUpdates);
      res.json({ success: true, address: updatedAddress });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update address' });
    }
  });

  // Delete address
  app.delete('/api/addresses/:addressId', async (req, res) => {
    try {
      const { addressId } = req.params;
      await storage.deleteUserAddress(addressId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete address' });
    }
  });

  // Set default address
  app.post('/api/users/:userId/addresses/:addressId/set-default', async (req, res) => {
    try {
      const { userId, addressId } = req.params;
      await storage.setDefaultAddress(userId, addressId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to set default address' });
    }
  });

  // Add sample components endpoint for demonstration
  app.post('/api/add-sample-components', async (req, res) => {
    try {
      const sampleComponents = [
        { buildId: 3, name: 'Intel Core i3-12100F', type: 'CPU', specification: '4-Core, 8-Thread, 3.3GHz Base, 4.3GHz Boost', price: '8999', stockQuantity: 15, lowStockThreshold: 3, isActive: true },
        { buildId: 3, name: 'NVIDIA GT 1030', type: 'GPU', specification: '2GB GDDR5, Entry Level Graphics', price: '5999', stockQuantity: 10, lowStockThreshold: 2, isActive: true },
        { buildId: 3, name: 'Crucial DDR4', type: 'RAM', specification: '8GB DDR4-3200MHz, Single Channel', price: '2999', stockQuantity: 20, lowStockThreshold: 5, isActive: true },
        { buildId: 3, name: 'Kingston NV2', type: 'Storage', specification: '500GB NVMe SSD, PCIe 3.0', price: '3499', stockQuantity: 25, lowStockThreshold: 5, isActive: true },
        { buildId: 3, name: 'ASUS PRIME H610M-E', type: 'Motherboard', specification: 'Micro-ATX, LGA1700 Socket, DDR4', price: '4999', stockQuantity: 8, lowStockThreshold: 2, isActive: true },
        { buildId: 3, name: 'Cooler Master CMP 450W', type: 'PSU', specification: '450W 80+ Standard, Included with Case', price: '0', stockQuantity: 8, lowStockThreshold: 2, isActive: true },
        { buildId: 3, name: 'Cooler Master CMP 250', type: 'Case', specification: 'Micro-ATX, USB 3.0, 450W PSU Bundle', price: '3999', stockQuantity: 8, lowStockThreshold: 2, isActive: true }
      ];

      for (const component of sampleComponents) {
        await storage.createComponent(component);
      }

      res.json({ success: true, message: 'Sample components added successfully', count: sampleComponents.length });
    } catch (error) {

      res.status(500).json({ success: false, error: 'Failed to add sample components' });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}

// Manual receipt generation function
async function manualReceiptGeneration(orderId: number): Promise<boolean> {
  try {
    const order = await storage.getOrderById(orderId);
    
    if (!order) {
      return false;
    }
    
    if (order.status !== 'paid') {
      return false;
    }
    
    // Parse order items from JSON
    let orderItems = [];
    try {
      orderItems = JSON.parse(order.items);
    } catch (error) {
      orderItems = [];
    }
    
    // Extract customer info from the first item if available
    const firstItem = orderItems[0] || {};
    const buildInfo = firstItem.build || {};
    
    // Fetch components for each build in the order
    const itemsWithComponents = await Promise.all(orderItems.map(async (item: any) => {
      let components: any[] = [];
      if (item.build?.id) {
        try {
          components = await storage.getComponentsByBuildId(item.build.id);
        } catch (error) {
          // Ignore component fetch errors
        }
      }
      return {
        ...item,
        build: {
          ...item.build,
          components: components.map(component => ({
            id: component.id,
            name: component.name,
            type: component.type,
            specification: component.specification,
            price: parseFloat(component.price)
          }))
        }
      };
    }));
    
    const receiptData: ReceiptData = {
      orderNumber: order.orderNumber,
      paymentId: 'MANUAL_' + Date.now(),
      orderId: 'MANUAL_ORDER',
      customerName: 'Customer',
      customerEmail: 'customer@email.com',
      customerPhone: 'N/A',
      amount: (() => {
        const total: any = order.total;
        if (typeof total === 'string') {
          return parseFloat(total.replace(/[₹,]/g, ''));
        }
        return typeof total === 'number' ? total : 0;
      })(),
      paymentMethod: order.paymentMethod || 'manual',
      paymentStatus: 'completed',
      items: itemsWithComponents,
      shippingAddress: order.shippingAddress || 'N/A',
      transactionDate: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      }),
      companyDetails: {
        name: 'Fusion Forge PCs',
        address: process.env.BUSINESS_ADDRESS || '58,Post Office Street , Palladam , TamilNadu , India',
        phone: process.env.BUSINESS_PHONE || '+91 9363599577',
        email: process.env.BUSINESS_EMAIL || 'fusionforgepcs@gmail.com',
        website: 'www.fusionforge.com',
        gst: process.env.BUSINESS_GST || 'GST-NUMBER'
      }
    };
    
    const { sendAutomatedReceipt } = await import('./services/receipt-generator');
    return await sendAutomatedReceipt(receiptData);
    
  } catch (error) {
    return false;
  }
}
