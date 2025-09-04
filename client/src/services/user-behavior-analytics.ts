// Advanced User Behavior Analytics Service
interface UserEvent {
  eventType: 'click' | 'scroll' | 'hover' | 'focus' | 'blur' | 'resize' | 'navigation';
  element: string;
  timestamp: number;
  coordinates?: { x: number; y: number };
  viewport?: { width: number; height: number };
  page: string;
  userId?: string;
  sessionId: string;
  additionalData?: Record<string, any>;
}

interface HeatmapData {
  x: number;
  y: number;
  intensity: number;
  element?: string;
  page: string;
}

interface FunnelStep {
  stepName: string;
  page: string;
  action: string;
  completedUsers: Set<string>;
  timestamp: number;
}

interface ConversionFunnel {
  steps: FunnelStep[];
  totalUsers: number;
  completionRates: number[];
  dropOffRates: number[];
  averageTimeToComplete: number;
}

class UserBehaviorAnalytics {
  private events: UserEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private heatmapData: Map<string, HeatmapData[]> = new Map();
  private funnelSteps: Map<string, FunnelStep> = new Map();
  private isRecording = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeTracking();
    this.setupFunnelTracking();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Initialize comprehensive event tracking
  private initializeTracking() {
    if (typeof window === 'undefined') return;

    this.isRecording = true;

    // Click tracking with heatmap data
    document.addEventListener('click', (event) => {
      const element = event.target as HTMLElement;
      const rect = element.getBoundingClientRect();
      
      this.recordEvent({
        eventType: 'click',
        element: this.getElementSelector(element),
        timestamp: Date.now(),
        coordinates: {
          x: event.clientX,
          y: event.clientY
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        page: window.location.pathname,
        sessionId: this.sessionId,
        userId: this.userId,
        additionalData: {
          elementText: element.textContent?.slice(0, 100) || '',
          elementType: element.tagName.toLowerCase(),
          elementClasses: element.className,
          relativeX: rect.left + event.offsetX,
          relativeY: rect.top + event.offsetY
        }
      });

      // Add to heatmap data
      this.addHeatmapPoint(window.location.pathname, event.clientX, event.clientY);
    });

    // Scroll depth tracking
    let maxScrollDepth = 0;
    let scrollTimer: NodeJS.Timeout;
    
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        
        if (scrollDepth > maxScrollDepth) {
          maxScrollDepth = scrollDepth;
          
          this.recordEvent({
            eventType: 'scroll',
            element: 'window',
            timestamp: Date.now(),
            page: window.location.pathname,
            sessionId: this.sessionId,
            userId: this.userId,
            additionalData: {
              scrollDepth,
              maxScrollDepth,
              scrollY: window.scrollY,
              documentHeight: document.body.scrollHeight
            }
          });
        }
      }, 150); // Debounce scroll events
    });

    // Mouse movement heatmap (sampled for performance)
    let mouseMoveCount = 0;
    document.addEventListener('mousemove', (event) => {
      mouseMoveCount++;
      // Sample every 20th mouse move to avoid performance impact
      if (mouseMoveCount % 20 === 0) {
        this.addHeatmapPoint(window.location.pathname, event.clientX, event.clientY, 0.1);
      }
    });

    // Form interaction tracking
    document.addEventListener('focus', (event) => {
      const element = event.target as HTMLElement;
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
        this.recordEvent({
          eventType: 'focus',
          element: this.getElementSelector(element),
          timestamp: Date.now(),
          page: window.location.pathname,
          sessionId: this.sessionId,
          userId: this.userId,
          additionalData: {
            fieldType: (element as HTMLInputElement).type || element.tagName.toLowerCase(),
            fieldName: (element as HTMLInputElement).name || '',
            fieldId: element.id || ''
          }
        });
      }
    });

    // Page navigation tracking
    let currentPath = window.location.pathname;
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== currentPath) {
        this.recordEvent({
          eventType: 'navigation',
          element: 'window',
          timestamp: Date.now(),
          page: window.location.pathname,
          sessionId: this.sessionId,
          userId: this.userId,
          additionalData: {
            previousPage: currentPath,
            newPage: window.location.pathname,
            navigationType: 'spa'
          }
        });
        currentPath = window.location.pathname;
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });

    // Session end tracking
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });

    // Visibility change tracking
    document.addEventListener('visibilitychange', () => {
      this.recordEvent({
        eventType: document.hidden ? 'blur' : 'focus',
        element: 'window',
        timestamp: Date.now(),
        page: window.location.pathname,
        sessionId: this.sessionId,
        userId: this.userId,
        additionalData: {
          visibilityState: document.visibilityState,
          isHidden: document.hidden
        }
      });
    });
  }

  // Setup conversion funnel tracking
  private setupFunnelTracking() {
    // Define key conversion funnel steps
    const funnelDefinition = [
      { stepName: 'landing', page: '/', action: 'page_view' },
      { stepName: 'browse_builds', page: '/builds', action: 'page_view' },
      { stepName: 'view_build_details', page: '/builds/*', action: 'page_view' },
      { stepName: 'add_to_cart', page: '*', action: 'click', element: '[data-testid*="add-to-cart"]' },
      { stepName: 'view_cart', page: '/checkout', action: 'page_view' },
      { stepName: 'start_checkout', page: '/checkout', action: 'click', element: '[data-testid*="checkout"]' },
      { stepName: 'complete_purchase', page: '/order-success', action: 'page_view' }
    ];

    // Initialize funnel steps
    funnelDefinition.forEach(step => {
      this.funnelSteps.set(step.stepName, {
        stepName: step.stepName,
        page: step.page,
        action: step.action,
        completedUsers: new Set(),
        timestamp: Date.now()
      });
    });
  }

  // Record user event
  private recordEvent(event: UserEvent) {
    if (!this.isRecording) return;

    this.events.push(event);
    
    // Check if this event represents a funnel step completion
    this.checkFunnelProgress(event);

    // Store events in localStorage (in production, send to analytics service)
    const maxEvents = 1000; // Limit to prevent storage bloat
    if (this.events.length > maxEvents) {
      this.events = this.events.slice(-maxEvents);
    }

    this.persistEvents();
  }

  // Add point to heatmap data
  private addHeatmapPoint(page: string, x: number, y: number, intensity: number = 1) {
    if (!this.heatmapData.has(page)) {
      this.heatmapData.set(page, []);
    }

    const pageHeatmap = this.heatmapData.get(page)!;
    
    // Check if point exists nearby (within 20px radius)
    const existingPoint = pageHeatmap.find(point => 
      Math.abs(point.x - x) <= 20 && Math.abs(point.y - y) <= 20
    );

    if (existingPoint) {
      existingPoint.intensity += intensity;
    } else {
      pageHeatmap.push({ x, y, intensity, page });
    }

    // Limit heatmap points per page
    if (pageHeatmap.length > 500) {
      pageHeatmap.splice(0, 100); // Remove oldest 100 points
    }
  }

  // Check funnel progress
  private checkFunnelProgress(event: UserEvent) {
    const userId = this.userId || this.sessionId;

    // Page view funnel steps
    if (event.eventType === 'navigation' || (event.eventType === 'click' && event.page === '/')) {
      const step = Array.from(this.funnelSteps.values()).find(step => 
        step.page === event.page || 
        (step.page === '*' && event.page.includes('builds/')) ||
        (step.page === '/builds/*' && event.page.includes('/builds/'))
      );

      if (step) {
        step.completedUsers.add(userId);
      }
    }

    // Action-based funnel steps
    if (event.eventType === 'click') {
      const step = Array.from(this.funnelSteps.values()).find(step => 
        step.action === 'click'
      );

      if (step) {
        step.completedUsers.add(userId);
      }
    }
  }

  // Generate heatmap visualization data
  getHeatmapData(page: string): HeatmapData[] {
    return this.heatmapData.get(page) || [];
  }

  // Get conversion funnel analysis
  getConversionFunnel(): ConversionFunnel {
    const steps = Array.from(this.funnelSteps.values());
    const completedUsersSizes = steps.map(step => Array.from(step.completedUsers).length);
    const totalUsers = Math.max(...completedUsersSizes);
    
    const completionRates = steps.map((step, index) => {
      if (index === 0) return 100; // First step is always 100%
      const previousStep = steps[index - 1];
      return Array.from(previousStep.completedUsers).length > 0 
        ? (Array.from(step.completedUsers).length / Array.from(previousStep.completedUsers).length) * 100 
        : 0;
    });

    const dropOffRates = completionRates.map(rate => 100 - rate);

    return {
      steps,
      totalUsers,
      completionRates,
      dropOffRates,
      averageTimeToComplete: this.calculateAverageTime()
    };
  }

  // Calculate average time to complete funnel
  private calculateAverageTime(): number {
    // Simple calculation based on session duration
    const sessionDuration = Date.now() - parseInt(this.sessionId.split('_')[1]);
    return Math.round(sessionDuration / 1000 / 60); // Minutes
  }

  // Get element selector for tracking
  private getElementSelector(element: HTMLElement): string {
    // Try to get a meaningful selector
    if (element.id) return `#${element.id}`;
    if (element.dataset.testid) return `[data-testid="${element.dataset.testid}"]`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  // Persist events to localStorage
  private persistEvents() {
    try {
      const data = {
        events: this.events.slice(-100), // Store last 100 events
        heatmapData: Object.fromEntries(this.heatmapData),
        sessionId: this.sessionId,
        lastUpdated: Date.now()
      };
      
      localStorage.setItem('fusionforge_analytics', JSON.stringify(data));
    } catch (error) {
      // Handle localStorage quota exceeded
      console.warn('Analytics data storage failed:', error);
    }
  }

  // End current session
  private endSession() {
    this.isRecording = false;
    this.recordEvent({
      eventType: 'blur',
      element: 'window',
      timestamp: Date.now(),
      page: window.location.pathname,
      sessionId: this.sessionId,
      userId: this.userId,
      additionalData: {
        sessionDuration: Date.now() - parseInt(this.sessionId.split('_')[1]),
        totalEvents: this.events.length,
        pagesVisited: [...new Set(this.events.map(e => e.page))].length
      }
    });
  }

  // Set user ID for tracking
  setUserId(userId: string) {
    this.userId = userId;
  }

  // Get user session summary
  getSessionSummary() {
    const pages = [...new Set(this.events.map(e => e.page))];
    const clicks = this.events.filter(e => e.eventType === 'click').length;
    const sessionDuration = Date.now() - parseInt(this.sessionId.split('_')[1]);

    return {
      sessionId: this.sessionId,
      userId: this.userId,
      pagesVisited: pages.length,
      totalEvents: this.events.length,
      clickEvents: clicks,
      sessionDuration: Math.round(sessionDuration / 1000),
      startTime: new Date(parseInt(this.sessionId.split('_')[1])),
      mostVisitedPage: this.getMostVisitedPage(),
      bounceRate: pages.length === 1 && sessionDuration < 30000
    };
  }

  private getMostVisitedPage(): string {
    const pageCounts = this.events.reduce((acc, event) => {
      acc[event.page] = (acc[event.page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(pageCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || '/';
  }

  // Export analytics data for admin dashboard
  exportAnalyticsData() {
    return {
      events: this.events,
      heatmapData: Object.fromEntries(this.heatmapData),
      funnelData: this.getConversionFunnel(),
      sessionSummary: this.getSessionSummary()
    };
  }
}

export const userBehaviorAnalytics = new UserBehaviorAnalytics();