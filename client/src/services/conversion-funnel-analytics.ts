// Advanced Conversion Funnel Analytics
interface FunnelEvent {
  userId: string;
  sessionId: string;
  step: string;
  timestamp: number;
  page: string;
  additionalData?: Record<string, any>;
}

interface FunnelStepMetrics {
  stepName: string;
  stepOrder: number;
  totalUsers: number;
  conversions: number;
  conversionRate: number;
  dropOffRate: number;
  averageTimeToNext: number;
  topDropOffReasons: string[];
}

interface UserJourney {
  userId: string;
  sessionId: string;
  steps: Array<{
    step: string;
    timestamp: number;
    timeFromPrevious: number;
    page: string;
  }>;
  completed: boolean;
  totalTime: number;
  dropOffStep?: string;
  dropOffReason?: string;
}

interface FunnelSegmentation {
  segment: string;
  userCount: number;
  conversionRate: number;
  averageOrderValue: number;
  topPerformingStep: string;
  biggestDropOff: string;
}

class ConversionFunnelAnalytics {
  private funnelDefinition = [
    { step: 'landing', name: 'Landing Page Visit', order: 1 },
    { step: 'browse', name: 'Browse PC Builds', order: 2 },
    { step: 'view_details', name: 'View Build Details', order: 3 },
    { step: 'configurator_open', name: 'Open Configurator', order: 4 },
    { step: 'configurator_modify', name: 'Modify Configuration', order: 5 },
    { step: 'add_to_cart', name: 'Add to Cart', order: 6 },
    { step: 'view_cart', name: 'View Cart', order: 7 },
    { step: 'checkout_start', name: 'Start Checkout', order: 8 },
    { step: 'checkout_form', name: 'Fill Checkout Form', order: 9 },
    { step: 'payment_initiate', name: 'Initiate Payment', order: 10 },
    { step: 'purchase_complete', name: 'Complete Purchase', order: 11 }
  ];

  private events: FunnelEvent[] = [];
  private userJourneys: Map<string, UserJourney> = new Map();

  constructor() {
    this.loadExistingData();
    this.setupEventTracking();
  }

  // Track funnel step completion
  trackStep(step: string, userId?: string, additionalData?: Record<string, any>) {
    const sessionId = this.getSessionId();
    const userKey = userId || sessionId;

    const event: FunnelEvent = {
      userId: userKey,
      sessionId,
      step,
      timestamp: Date.now(),
      page: window.location.pathname,
      additionalData
    };

    this.events.push(event);
    this.updateUserJourney(userKey, event);
    this.persistData();
  }

  // Update user journey tracking
  private updateUserJourney(userId: string, event: FunnelEvent) {
    let journey = this.userJourneys.get(userId);
    
    if (!journey) {
      journey = {
        userId,
        sessionId: event.sessionId,
        steps: [],
        completed: false,
        totalTime: 0,
      };
      this.userJourneys.set(userId, journey);
    }

    // Add step to journey
    const previousStep = journey.steps[journey.steps.length - 1];
    const timeFromPrevious = previousStep ? event.timestamp - previousStep.timestamp : 0;

    journey.steps.push({
      step: event.step,
      timestamp: event.timestamp,
      timeFromPrevious,
      page: event.page
    });

    // Check if funnel is completed
    if (event.step === 'purchase_complete') {
      journey.completed = true;
      journey.totalTime = event.timestamp - journey.steps[0].timestamp;
    }

    // Detect drop-off
    if (!journey.completed && journey.steps.length > 1) {
      const timeSinceLastStep = Date.now() - event.timestamp;
      if (timeSinceLastStep > 5 * 60 * 1000) { // 5 minutes without activity
        journey.dropOffStep = event.step;
        journey.dropOffReason = this.inferDropOffReason(journey.steps);
      }
    }
  }

  // Calculate comprehensive funnel metrics
  getFunnelMetrics(): FunnelStepMetrics[] {
    const metrics: FunnelStepMetrics[] = [];
    
    // Group events by step
    const stepEvents = new Map<string, FunnelEvent[]>();
    this.events.forEach(event => {
      if (!stepEvents.has(event.step)) {
        stepEvents.set(event.step, []);
      }
      stepEvents.get(event.step)!.push(event);
    });

    // Calculate metrics for each funnel step
    this.funnelDefinition.forEach((stepDef, index) => {
      const stepEvents_ = stepEvents.get(stepDef.step) || [];
      const uniqueUsers = new Set(stepEvents_.map(e => e.userId));
      const totalUsers = uniqueUsers.size;

      // Calculate conversion rate from previous step
      let conversionRate = 100;
      if (index > 0) {
        const prevStepDef = this.funnelDefinition[index - 1];
        const prevStepEvents = stepEvents.get(prevStepDef.step) || [];
        const prevUniqueUsers = new Set(prevStepEvents.map(e => e.userId));
        conversionRate = prevUniqueUsers.size > 0 ? (totalUsers / prevUniqueUsers.size) * 100 : 0;
      }

      const dropOffRate = 100 - conversionRate;

      // Calculate average time to next step
      const averageTimeToNext = this.calculateAverageTimeToNext(stepDef.step, stepEvents_);

      // Get top drop-off reasons
      const topDropOffReasons = this.getTopDropOffReasons(stepDef.step);

      metrics.push({
        stepName: stepDef.name,
        stepOrder: stepDef.order,
        totalUsers,
        conversions: totalUsers,
        conversionRate,
        dropOffRate,
        averageTimeToNext,
        topDropOffReasons
      });
    });

    return metrics;
  }

  // Get user journey analysis
  getUserJourneys(): UserJourney[] {
    return Array.from(this.userJourneys.values());
  }

  // Segment users for funnel analysis
  segmentFunnelAnalysis(): FunnelSegmentation[] {
    const journeys = this.getUserJourneys();
    const segmentations: FunnelSegmentation[] = [];

    // Segment by device type (simplified)
    const mobileUsers = journeys.filter(j => j.steps.some(s => s.page.includes('mobile')));
    const desktopUsers = journeys.filter(j => !j.steps.some(s => s.page.includes('mobile')));

    // Segment by traffic source  
    const organicUsers = journeys.filter(j => j.steps.length > 2);
    const directUsers = journeys.filter(j => j.steps.length <= 2);

    // Create segmentation analysis
    [
      { name: 'Mobile Users', users: mobileUsers },
      { name: 'Desktop Users', users: desktopUsers },
      { name: 'Organic Traffic', users: organicUsers },
      { name: 'Direct Traffic', users: directUsers }
    ].forEach(segment => {
      const completed = segment.users.filter(u => u.completed);
      const conversionRate = segment.users.length > 0 ? (completed.length / segment.users.length) * 100 : 0;
      
      segmentations.push({
        segment: segment.name,
        userCount: segment.users.length,
        conversionRate,
        averageOrderValue: this.calculateAverageOrderValue(completed),
        topPerformingStep: this.getTopPerformingStep(segment.users),
        biggestDropOff: this.getBiggestDropOff(segment.users)
      });
    });

    return segmentations;
  }

  // Helper methods
  private calculateAverageTimeToNext(step: string, events: FunnelEvent[]): number {
    const timesToNext: number[] = [];
    
    events.forEach(event => {
      const userJourney = this.userJourneys.get(event.userId);
      if (userJourney) {
        const stepIndex = userJourney.steps.findIndex(s => s.step === step);
        if (stepIndex >= 0 && stepIndex < userJourney.steps.length - 1) {
          const nextStep = userJourney.steps[stepIndex + 1];
          timesToNext.push(nextStep.timeFromPrevious);
        }
      }
    });

    return timesToNext.length > 0 ? timesToNext.reduce((sum, time) => sum + time, 0) / timesToNext.length : 0;
  }

  private getTopDropOffReasons(step: string): string[] {
    const dropOffs = Array.from(this.userJourneys.values())
      .filter(journey => journey.dropOffStep === step)
      .map(journey => journey.dropOffReason || 'Unknown');

    // Count occurrences
    const reasonCounts = dropOffs.reduce((acc, reason) => {
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Return top 3 reasons
    return Object.entries(reasonCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([reason]) => reason);
  }

  private calculateAverageOrderValue(completedJourneys: UserJourney[]): number {
    // In a real implementation, this would be calculated from actual order data
    // For now, return a placeholder calculation
    return completedJourneys.length > 0 ? 65000 : 0; // Average PC build price
  }

  private getTopPerformingStep(journeys: UserJourney[]): string {
    const stepCompletions = new Map<string, number>();
    
    journeys.forEach(journey => {
      journey.steps.forEach(step => {
        stepCompletions.set(step.step, (stepCompletions.get(step.step) || 0) + 1);
      });
    });

    const maxStep = Array.from(stepCompletions.entries()).reduce((max, [step, count]) => 
      count > max.count ? { step, count } : max, { step: '', count: 0 });

    return maxStep.step || 'landing';
  }

  private getBiggestDropOff(journeys: UserJourney[]): string {
    const dropOffs = new Map<string, number>();
    
    journeys.forEach(journey => {
      if (journey.dropOffStep) {
        dropOffs.set(journey.dropOffStep, (dropOffs.get(journey.dropOffStep) || 0) + 1);
      }
    });

    const maxDropOff = Array.from(dropOffs.entries()).reduce((max, [step, count]) => 
      count > max.count ? { step, count } : max, { step: '', count: 0 });

    return maxDropOff.step || 'landing';
  }

  private inferDropOffReason(steps: Array<{ step: string; timestamp: number; page: string }>): string {
    const lastStep = steps[steps.length - 1];
    
    // Infer based on last step and patterns
    if (lastStep.step === 'checkout_form') return 'Form complexity';
    if (lastStep.step === 'payment_initiate') return 'Payment issues';
    if (lastStep.step === 'view_cart') return 'Price concerns';
    if (lastStep.step === 'configurator_modify') return 'Configuration difficulty';
    
    return 'Navigation/UX issues';
  }

  private setupEventTracking() {
    // Automatically track common funnel events
    if (typeof window === 'undefined') return;

    // Track page views as funnel steps
    const trackPageAsFunnelStep = () => {
      const path = window.location.pathname;
      
      if (path === '/') this.trackStep('landing');
      else if (path === '/builds') this.trackStep('browse');
      else if (path.includes('/builds/')) this.trackStep('view_details');
      else if (path === '/configurator') this.trackStep('configurator_open');
      else if (path === '/checkout') this.trackStep('view_cart');
      else if (path === '/order-success') this.trackStep('purchase_complete');
    };

    // Initial page load
    trackPageAsFunnelStep();

    // Track navigation changes
    let currentPath = window.location.pathname;
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        trackPageAsFunnelStep();
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }

  private getSessionId(): string {
    const stored = sessionStorage.getItem('fusionforge_session_id');
    if (stored) return stored;
    
    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('fusionforge_session_id', newId);
    return newId;
  }

  private loadExistingData() {
    try {
      const eventsData = localStorage.getItem('fusionforge_funnel_events');
      if (eventsData) {
        this.events = JSON.parse(eventsData);
      }

      const journeysData = localStorage.getItem('fusionforge_user_journeys');
      if (journeysData) {
        const journeys = JSON.parse(journeysData);
        journeys.forEach((journey: UserJourney) => {
          this.userJourneys.set(journey.userId, journey);
        });
      }
    } catch (error) {
      console.warn('Failed to load funnel analytics data:', error);
    }
  }

  private persistData() {
    try {
      // Limit stored events to prevent localStorage bloat
      const recentEvents = this.events.slice(-1000);
      localStorage.setItem('fusionforge_funnel_events', JSON.stringify(recentEvents));

      const journeysArray = Array.from(this.userJourneys.values()).slice(-500);
      localStorage.setItem('fusionforge_user_journeys', JSON.stringify(journeysArray));
    } catch (error) {
      console.warn('Failed to persist funnel analytics data:', error);
    }
  }

  // Export analytics for admin dashboard
  exportFunnelData() {
    return {
      funnelMetrics: this.getFunnelMetrics(),
      userJourneys: this.getUserJourneys(),
      segmentation: this.segmentFunnelAnalysis(),
      totalEvents: this.events.length,
      totalUsers: this.userJourneys.size,
      completionRate: Array.from(this.userJourneys.values()).filter(j => j.completed).length / this.userJourneys.size * 100
    };
  }
}

export const conversionFunnelAnalytics = new ConversionFunnelAnalytics();