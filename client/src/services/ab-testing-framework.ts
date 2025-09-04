// A/B Testing Framework for UI Improvements
interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // Percentage allocation
  config: Record<string, any>;
  isActive: boolean;
}

interface ABTest {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: ABTestVariant[];
  targetMetric: string;
  sampleSize: number;
  currentParticipants: number;
  confidenceLevel: number;
}

interface ABTestResult {
  testId: string;
  variantId: string;
  userId: string;
  sessionId: string;
  conversions: number;
  interactions: number;
  timeOnPage: number;
  bounceRate: number;
  targetMetricValue: number;
}

interface ABTestAnalysis {
  testId: string;
  variants: Array<{
    variantId: string;
    participants: number;
    conversionRate: number;
    averageTimeOnPage: number;
    bounceRate: number;
    confidence: number;
    isWinner: boolean;
  }>;
  winner?: string;
  statisticalSignificance: boolean;
  recommendedAction: 'continue' | 'stop' | 'extend' | 'modify';
}

class ABTestingFramework {
  private activeTests: Map<string, ABTest> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> testId -> variantId
  private results: Map<string, ABTestResult[]> = new Map();

  constructor() {
    this.initializeDefaultTests();
    this.loadUserAssignments();
  }

  // Initialize default A/B tests
  private initializeDefaultTests() {
    const defaultTests: ABTest[] = [
      {
        id: 'homepage_hero_cta',
        name: 'Homepage CTA Button Test',
        description: 'Test different call-to-action buttons on the homepage',
        startDate: new Date().toISOString(),
        status: 'running',
        variants: [
          {
            id: 'control',
            name: 'Original Button',
            weight: 50,
            config: {
              buttonText: 'Build Your PC',
              buttonColor: 'blue',
              buttonSize: 'large'
            },
            isActive: true
          },
          {
            id: 'variant_a',
            name: 'Urgency Button',
            weight: 50,
            config: {
              buttonText: 'Start Building Now',
              buttonColor: 'orange',
              buttonSize: 'large'
            },
            isActive: true
          }
        ],
        targetMetric: 'click_through_rate',
        sampleSize: 1000,
        currentParticipants: 0,
        confidenceLevel: 95
      },
      {
        id: 'product_card_layout',
        name: 'PC Build Card Layout',
        description: 'Test different layouts for PC build cards',
        startDate: new Date().toISOString(),
        status: 'running',
        variants: [
          {
            id: 'control',
            name: 'Current Layout',
            weight: 50,
            config: {
              layout: 'vertical',
              showSpecs: true,
              showPrice: 'prominent'
            },
            isActive: true
          },
          {
            id: 'variant_a',
            name: 'Horizontal Layout',
            weight: 50,
            config: {
              layout: 'horizontal',
              showSpecs: false,
              showPrice: 'subtle'
            },
            isActive: true
          }
        ],
        targetMetric: 'engagement_rate',
        sampleSize: 500,
        currentParticipants: 0,
        confidenceLevel: 90
      },
      {
        id: 'checkout_flow',
        name: 'Checkout Process Flow',
        description: 'Test single-page vs multi-step checkout',
        startDate: new Date().toISOString(),
        status: 'running',
        variants: [
          {
            id: 'control',
            name: 'Single Page Checkout',
            weight: 50,
            config: {
              steps: 1,
              showProgress: false,
              layout: 'single_column'
            },
            isActive: true
          },
          {
            id: 'variant_a',
            name: 'Multi-step Checkout',
            weight: 50,
            config: {
              steps: 3,
              showProgress: true,
              layout: 'wizard'
            },
            isActive: true
          }
        ],
        targetMetric: 'conversion_rate',
        sampleSize: 300,
        currentParticipants: 0,
        confidenceLevel: 95
      }
    ];

    defaultTests.forEach(test => {
      this.activeTests.set(test.id, test);
      this.results.set(test.id, []);
    });
  }

  // Assign user to test variant
  assignUserToTest(testId: string, userId?: string): string | null {
    const test = this.activeTests.get(testId);
    if (!test || test.status !== 'running') return null;

    const userKey = userId || this.getSessionId();
    
    // Check if user already assigned to this test
    if (this.userAssignments.has(userKey) && this.userAssignments.get(userKey)!.has(testId)) {
      return this.userAssignments.get(userKey)!.get(testId)!;
    }

    // Assign to variant based on weights
    const random = Math.random() * 100;
    let cumulative = 0;
    let assignedVariant: string | null = null;

    for (const variant of test.variants) {
      if (!variant.isActive) continue;
      cumulative += variant.weight;
      if (random <= cumulative) {
        assignedVariant = variant.id;
        break;
      }
    }

    if (assignedVariant) {
      // Store assignment
      if (!this.userAssignments.has(userKey)) {
        this.userAssignments.set(userKey, new Map());
      }
      this.userAssignments.get(userKey)!.set(testId, assignedVariant);
      
      // Update participant count
      test.currentParticipants++;
      
      this.saveUserAssignments();
    }

    return assignedVariant;
  }

  // Get variant config for user
  getVariantConfig(testId: string, userId?: string): Record<string, any> | null {
    const userKey = userId || this.getSessionId();
    const variantId = this.userAssignments.get(userKey)?.get(testId);
    
    if (!variantId) return null;

    const test = this.activeTests.get(testId);
    const variant = test?.variants.find(v => v.id === variantId);
    
    return variant?.config || null;
  }

  // Record test result/conversion
  recordConversion(testId: string, metricValue: number, additionalData?: Record<string, any>, userId?: string) {
    const userKey = userId || this.getSessionId();
    const variantId = this.userAssignments.get(userKey)?.get(testId);
    
    if (!variantId) return;

    const result: ABTestResult = {
      testId,
      variantId,
      userId: userKey,
      sessionId: this.getSessionId(),
      conversions: metricValue,
      interactions: additionalData?.interactions || 1,
      timeOnPage: additionalData?.timeOnPage || 0,
      bounceRate: additionalData?.bounceRate || 0,
      targetMetricValue: metricValue
    };

    if (!this.results.has(testId)) {
      this.results.set(testId, []);
    }
    
    this.results.get(testId)!.push(result);
    this.persistResults(testId);
  }

  // Analyze A/B test results
  analyzeTest(testId: string): ABTestAnalysis | null {
    const test = this.activeTests.get(testId);
    const results = this.results.get(testId) || [];
    
    if (!test || results.length < 30) return null; // Need minimum sample size

    // Group results by variant
    const variantResults = new Map<string, ABTestResult[]>();
    results.forEach(result => {
      if (!variantResults.has(result.variantId)) {
        variantResults.set(result.variantId, []);
      }
      variantResults.get(result.variantId)!.push(result);
    });

    // Calculate metrics for each variant
    const variantAnalysis = Array.from(variantResults.entries()).map(([variantId, variantResults]) => {
      const participants = variantResults.length;
      const totalConversions = variantResults.reduce((sum, r) => sum + r.conversions, 0);
      const conversionRate = participants > 0 ? (totalConversions / participants) * 100 : 0;
      const averageTimeOnPage = variantResults.reduce((sum, r) => sum + r.timeOnPage, 0) / participants;
      const bounceRate = variantResults.reduce((sum, r) => sum + r.bounceRate, 0) / participants;
      
      // Simple confidence calculation (Chi-square test approximation)
      const confidence = this.calculateConfidence(variantResults, results);

      return {
        variantId,
        participants,
        conversionRate,
        averageTimeOnPage,
        bounceRate,
        confidence,
        isWinner: false // Will be determined below
      };
    });

    // Determine winner
    const bestVariant = variantAnalysis.reduce((best, current) => 
      current.conversionRate > best.conversionRate ? current : best
    );
    
    if (bestVariant) {
      bestVariant.isWinner = true;
    }

    // Statistical significance check
    const statisticalSignificance = variantAnalysis.some(v => v.confidence >= test.confidenceLevel);

    // Recommendation
    let recommendedAction: 'continue' | 'stop' | 'extend' | 'modify' = 'continue';
    if (statisticalSignificance && bestVariant.confidence >= test.confidenceLevel) {
      recommendedAction = 'stop';
    } else if (test.currentParticipants >= test.sampleSize * 2) {
      recommendedAction = 'modify';
    } else if (test.currentParticipants >= test.sampleSize) {
      recommendedAction = 'extend';
    }

    return {
      testId,
      variants: variantAnalysis,
      winner: bestVariant?.variantId,
      statisticalSignificance,
      recommendedAction
    };
  }

  // Simple confidence calculation
  private calculateConfidence(variantResults: ABTestResult[], allResults: ABTestResult[]): number {
    const variantConversions = variantResults.reduce((sum, r) => sum + r.conversions, 0);
    const variantParticipants = variantResults.length;
    const totalConversions = allResults.reduce((sum, r) => sum + r.conversions, 0);
    const totalParticipants = allResults.length;

    if (variantParticipants < 30 || totalParticipants < 60) return 0;

    // Simplified confidence calculation (not statistically rigorous)
    const variantRate = variantConversions / variantParticipants;
    const overallRate = totalConversions / totalParticipants;
    const difference = Math.abs(variantRate - overallRate);
    
    // Return confidence as percentage (simplified)
    return Math.min(95, difference * variantParticipants * 2);
  }

  // Get session ID
  private getSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Persist data
  private saveUserAssignments() {
    try {
      const data = Array.from(this.userAssignments.entries()).map(([userId, tests]) => ({
        userId,
        tests: Array.from(tests.entries())
      }));
      
      localStorage.setItem('fusionforge_ab_assignments', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save A/B test assignments:', error);
    }
  }

  private loadUserAssignments() {
    try {
      const data = localStorage.getItem('fusionforge_ab_assignments');
      if (data) {
        const parsed = JSON.parse(data);
        parsed.forEach(({ userId, tests }: any) => {
          this.userAssignments.set(userId, new Map(tests));
        });
      }
    } catch (error) {
      console.warn('Failed to load A/B test assignments:', error);
    }
  }

  private persistResults(testId: string) {
    try {
      const results = this.results.get(testId) || [];
      localStorage.setItem(`fusionforge_ab_results_${testId}`, JSON.stringify(results.slice(-500)));
    } catch (error) {
      console.warn('Failed to persist A/B test results:', error);
    }
  }
}

export const abTestingFramework = new ABTestingFramework();