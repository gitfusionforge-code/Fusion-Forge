import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import EnhancedErrorBoundary from "@/components/enhanced-error-boundary";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import AnalyticsTracker from "@/components/analytics-tracker";
import CartSidebar from "@/components/cart-sidebar";
import PerformanceMonitor from "@/components/performance-monitor";
import LiveChatWidget from "@/components/live-chat-widget";
import { Suspense, lazy } from "react";
import LoadingSpinner from "@/components/loading-spinner";

// Lazy load all pages for better performance
const Home = lazy(() => import("@/pages/home"));
const Builds = lazy(() => import("@/pages/builds"));
const BuildDetails = lazy(() => import("@/pages/build-details"));
const Contact = lazy(() => import("@/pages/contact"));
const Configurator = lazy(() => import("@/pages/configurator"));
const About = lazy(() => import("@/pages/about"));
const Services = lazy(() => import("@/pages/services"));
const FAQ = lazy(() => import("@/pages/faq"));
const Admin = lazy(() => import("@/pages/admin"));
const AdminLogin = lazy(() => import("@/pages/admin-login"));
const Login = lazy(() => import("@/pages/Login"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Profile = lazy(() => import("@/pages/profile"));
const ProfileBuilds = lazy(() => import("@/pages/profile-builds"));
const ProfileOrders = lazy(() => import("@/pages/profile-orders"));
const ProfileSettings = lazy(() => import("@/pages/profile-settings"));
const OrderSuccess = lazy(() => import("@/pages/order-success"));
const SubscriptionPlans = lazy(() => import("@/pages/subscription-plans"));
const Subscriptions = lazy(() => import("@/pages/subscriptions"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Suspense fallback={<LoadingSpinner />}>
          <Home />
        </Suspense>
      </Route>
      <Route path="/builds">
        <Suspense fallback={<LoadingSpinner />}>
          <Builds />
        </Suspense>
      </Route>
      <Route path="/builds/:id">
        <Suspense fallback={<LoadingSpinner />}>
          <BuildDetails />
        </Suspense>
      </Route>
      <Route path="/contact">
        <Suspense fallback={<LoadingSpinner />}>
          <Contact />
        </Suspense>
      </Route>
      <Route path="/configurator">
        <Suspense fallback={<LoadingSpinner />}>
          <Configurator />
        </Suspense>
      </Route>
      <Route path="/about">
        <Suspense fallback={<LoadingSpinner />}>
          <About />
        </Suspense>
      </Route>
      <Route path="/services">
        <Suspense fallback={<LoadingSpinner />}>
          <Services />
        </Suspense>
      </Route>
      <Route path="/faq">
        <Suspense fallback={<LoadingSpinner />}>
          <FAQ />
        </Suspense>
      </Route>
      <Route path="/login">
        <Suspense fallback={<LoadingSpinner />}>
          <Login />
        </Suspense>
      </Route>
      <Route path="/checkout">
        <Suspense fallback={<LoadingSpinner />}>
          <Checkout />
        </Suspense>
      </Route>
      <Route path="/checkout/success">
        <Suspense fallback={<LoadingSpinner />}>
          <OrderSuccess />
        </Suspense>
      </Route>
      <Route path="/dashboard">
        <Suspense fallback={<LoadingSpinner />}>
          <Dashboard />
        </Suspense>
      </Route>
      <Route path="/profile">
        <Suspense fallback={<LoadingSpinner />}>
          <Profile />
        </Suspense>
      </Route>
      <Route path="/profile/builds">
        <Suspense fallback={<LoadingSpinner />}>
          <ProfileBuilds />
        </Suspense>
      </Route>
      <Route path="/profile/orders">
        <Suspense fallback={<LoadingSpinner />}>
          <ProfileOrders />
        </Suspense>
      </Route>
      <Route path="/profile/settings">
        <Suspense fallback={<LoadingSpinner />}>
          <ProfileSettings />
        </Suspense>
      </Route>
      <Route path="/subscription-plans">
        <Suspense fallback={<LoadingSpinner />}>
          <SubscriptionPlans />
        </Suspense>
      </Route>
      <Route path="/subscriptions">
        <Suspense fallback={<LoadingSpinner />}>
          <Subscriptions />
        </Suspense>
      </Route>
      <Route path="/admin/login">
        <Suspense fallback={<LoadingSpinner />}>
          <AdminLogin />
        </Suspense>
      </Route>
      <Route path="/admin">
        <Suspense fallback={<LoadingSpinner />}>
          <Admin />
        </Suspense>
      </Route>
      <Route>
        <Suspense fallback={<LoadingSpinner />}>
          <NotFound />
        </Suspense>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <EnhancedErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="fusionforge-theme">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1">
                  <Router />
                </main>
                <Footer />
              </div>
              <CartSidebar />
              <LiveChatWidget />
              <Toaster />
              <AnalyticsTracker />
              <PerformanceMonitor />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </EnhancedErrorBoundary>
  );
}

export default App;
