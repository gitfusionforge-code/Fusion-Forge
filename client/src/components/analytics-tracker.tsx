import { useEffect } from "react";
import { useLocation } from "wouter";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// Initialize Google Analytics
export function initializeAnalytics() {
  if (typeof window === 'undefined') return;
  
  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: any[]) {
    window.dataLayer!.push(args);
  };
  
  window.gtag('js', new Date());
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (measurementId) {
    window.gtag('config', measurementId, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
}

// Track page views
export function usePageTracking() {
  const [location] = useLocation();
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
      if (measurementId) {
        window.gtag('config', measurementId, {
          page_path: location,
          page_title: document.title,
          page_location: window.location.href,
        });
      }
      
      // Track internal navigation
      trackEvent('page_view', {
        page_path: location,
        page_title: document.title,
      });
    }
  }, [location]);
}

// Track custom events
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      event_category: 'engagement',
      event_label: eventName,
      ...properties,
    });
  }
  
  // Also log to console in development
  if (import.meta.env.DEV) {
    console.log(`Analytics Event: ${eventName}`, properties);
  }
}

// Track e-commerce events
export function trackPurchaseIntent(buildName: string, price: string, category: string) {
  trackEvent('purchase_intent', {
    item_name: buildName,
    item_category: category,
    value: parseFloat(price.replace(/[₹,]/g, '')),
    currency: 'INR',
  });
}

export function trackQuoteRequest(budget: string, useCase: string) {
  trackEvent('quote_request', {
    budget_range: budget,
    use_case: useCase,
    event_category: 'conversion',
  });
}

export function trackBuildView(buildName: string, category: string) {
  trackEvent('view_item', {
    item_name: buildName,
    item_category: category,
    event_category: 'engagement',
  });
}

export function trackBuildComparison(buildNames: string[]) {
  trackEvent('compare_builds', {
    build_count: buildNames.length,
    build_names: buildNames.join(', '),
    event_category: 'engagement',
  });
}

// Analytics component to be included in App.tsx
export default function AnalyticsTracker() {
  usePageTracking();
  
  useEffect(() => {
    initializeAnalytics();
  }, []);
  
  return null;
}