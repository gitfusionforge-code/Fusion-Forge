import { useEffect } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
}

export default function PerformanceMonitor() {
  useEffect(() => {
    // Monitor Core Web Vitals
    const observePerformance = () => {
      const metrics: Partial<PerformanceMetrics> = {};

      // Navigation timing
      if (typeof window !== 'undefined' && 'performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          metrics.loadTime = navigation.loadEventEnd - navigation.loadEventStart;
          metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
        }

        // Core Web Vitals
        if ('PerformanceObserver' in window) {
          // Largest Contentful Paint (LCP)
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            metrics.largestContentfulPaint = lastEntry.startTime;
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          // First Input Delay (FID)
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach((entry: any) => {
              metrics.firstInputDelay = entry.processingStart - entry.startTime;
            });
          }).observe({ entryTypes: ['first-input'] });

          // Cumulative Layout Shift (CLS)
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            let clsScore = 0;
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsScore += entry.value;
              }
            });
            metrics.cumulativeLayoutShift = clsScore;
          }).observe({ entryTypes: ['layout-shift'] });
        }

        // Log performance metrics in development (only if there are performance issues)
        if (import.meta.env.DEV) {
          setTimeout(() => {
            // Only log if there are performance issues
            const hasPerformanceIssues = 
              (metrics.largestContentfulPaint && metrics.largestContentfulPaint > 2500) ||
              (metrics.firstInputDelay && metrics.firstInputDelay > 100) ||
              (metrics.cumulativeLayoutShift && metrics.cumulativeLayoutShift > 0.1);

            if (hasPerformanceIssues) {
              console.group('⚠️ Performance Issues Detected');
              if (metrics.largestContentfulPaint && metrics.largestContentfulPaint > 2500) {
                console.warn('LCP is high:', metrics.largestContentfulPaint?.toFixed(2) + 'ms (should be < 2.5s)');
              }
              if (metrics.firstInputDelay && metrics.firstInputDelay > 100) {
                console.warn('FID is high:', metrics.firstInputDelay?.toFixed(2) + 'ms (should be < 100ms)');
              }
              if (metrics.cumulativeLayoutShift && metrics.cumulativeLayoutShift > 0.1) {
                console.warn('CLS is high:', metrics.cumulativeLayoutShift?.toFixed(4) + ' (should be < 0.1)');
              }
              console.groupEnd();
            }
          }, 3000);
        }
      }
    };

    // Run after page load
    if (document.readyState === 'complete') {
      observePerformance();
    } else {
      window.addEventListener('load', observePerformance);
    }

    return () => {
      window.removeEventListener('load', observePerformance);
    };
  }, []);

  return null; // This component doesn't render anything
}