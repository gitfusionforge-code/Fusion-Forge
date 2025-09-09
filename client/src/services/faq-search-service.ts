// FAQ Search Service with AI-powered recommendations
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpful: number;
  notHelpful: number;
  lastUpdated: number;
  popularity: number;
}

interface SearchResult {
  item: FAQItem;
  relevanceScore: number;
  matchType: 'exact' | 'partial' | 'semantic' | 'tag';
  highlightedText: string;
}

interface FAQAnalytics {
  totalQuestions: number;
  totalSearches: number;
  topSearchTerms: Array<{ term: string; count: number }>;
  mostHelpfulFAQs: FAQItem[];
  leastHelpfulFAQs: FAQItem[];
  categoryPopularity: Record<string, number>;
  searchSuccessRate: number;
}

class FAQSearchService {
  private faqDatabase: Map<string, FAQItem> = new Map();
  private searchHistory: Array<{ query: string; timestamp: number; resultCount: number }> = [];
  private searchIndex: Map<string, Set<string>> = new Map(); // word -> FAQ IDs

  constructor() {
    this.initializeFAQDatabase();
    this.buildSearchIndex();
  }

  // Initialize comprehensive FAQ database
  private initializeFAQDatabase() {
    const faqData: Omit<FAQItem, 'id'>[] = [
      // PC Building FAQs
      {
        question: "What's the difference between budget, mid-range, and high-end PC builds?",
        answer: "Budget builds (₹15K-30K) are perfect for basic computing, office work, and light gaming. Mid-range builds (₹40K-70K) handle modern gaming at 1080p and content creation. High-end builds (₹80K+) deliver 4K gaming, professional workloads, and future-proofing.",
        category: "PC Building",
        tags: ["budget", "performance", "gaming", "comparison"],
        helpful: 45,
        notHelpful: 2,
        lastUpdated: Date.now(),
        popularity: 85
      },
      {
        question: "How do I know if components are compatible with each other?",
        answer: "Our PC configurator automatically checks compatibility! It verifies CPU-motherboard sockets, RAM-motherboard memory types, PSU wattage requirements, case clearance, and identifies potential bottlenecks. Red warnings indicate incompatibility, while yellow warnings suggest optimization opportunities.",
        category: "PC Building",
        tags: ["compatibility", "configurator", "components"],
        helpful: 38,
        notHelpful: 1,
        lastUpdated: Date.now(),
        popularity: 72
      },
      
      // Technical Support FAQs
      {
        question: "My PC build isn't turning on. What should I check?",
        answer: "First, verify all power connections: 24-pin motherboard, 8-pin CPU, and GPU power cables. Check RAM is properly seated with clips engaged. Ensure PSU switch is ON and power cable is connected. If still no response, try powering on with one RAM stick only.",
        category: "Technical Support",
        tags: ["troubleshooting", "power", "boot", "hardware"],
        helpful: 52,
        notHelpful: 4,
        lastUpdated: Date.now(),
        popularity: 68
      },
      {
        question: "How do I update my graphics card drivers?",
        answer: "For NVIDIA cards, download GeForce Experience or visit nvidia.com/drivers. For AMD cards, download AMD Software or visit amd.com/support. Always uninstall old drivers using DDU (Display Driver Uninstaller) before installing new ones for best performance.",
        category: "Technical Support",
        tags: ["drivers", "gpu", "nvidia", "amd", "updates"],
        helpful: 41,
        notHelpful: 3,
        lastUpdated: Date.now(),
        popularity: 64
      },

      // Warranty & Support FAQs
      {
        question: "What warranty coverage do I get with my PC build?",
        answer: "All components have manufacturer warranties (1-3 years depending on component). We provide 1-year assembly warranty covering our build quality. Extended warranties available for purchase. Individual component issues are handled directly with manufacturers for fastest resolution.",
        category: "Warranty",
        tags: ["warranty", "coverage", "manufacturer", "assembly"],
        helpful: 29,
        notHelpful: 1,
        lastUpdated: Date.now(),
        popularity: 56
      },
      {
        question: "How do I claim warranty if a component fails?",
        answer: "Contact us immediately with your order number and describe the issue. We'll guide you through diagnostics and handle manufacturer warranty claims on your behalf. Keep all original packaging and receipts. Most issues can be resolved within 7-14 days.",
        category: "Warranty",
        tags: ["warranty", "claim", "rma", "replacement"],
        helpful: 33,
        notHelpful: 2,
        lastUpdated: Date.now(),
        popularity: 49
      },

      // Delivery & Shipping FAQs
      {
        question: "How long does it take to build and ship my PC?",
        answer: "Standard builds: 3-5 business days. Custom configurations: 5-7 business days. High-demand components may extend timelines. We'll notify you of any delays immediately. Express assembly available for urgent orders (additional charges apply).",
        category: "Delivery",
        tags: ["shipping", "timeline", "assembly", "delivery"],
        helpful: 36,
        notHelpful: 1,
        lastUpdated: Date.now(),
        popularity: 71
      },
      {
        question: "Do you ship nationwide? What are the charges?",
        answer: "Yes! We ship across India via professional courier services. Free shipping on orders above ₹50,000. Standard shipping: ₹500-1500 depending on location. Express shipping available. All shipments are fully insured and trackable.",
        category: "Delivery",
        tags: ["shipping", "nationwide", "charges", "free shipping"],
        helpful: 42,
        notHelpful: 2,
        lastUpdated: Date.now(),
        popularity: 67
      },

      // Payment & Billing FAQs
      {
        question: "What payment methods do you accept?",
        answer: "We accept UPI, Net Banking, Credit Cards, Debit Cards via Razorpay. EMI options available for orders above ₹10,000 (3, 6, 9, 12 months). No-cost EMI available on select builds. Cash on delivery not available due to high-value products.",
        category: "Payment",
        tags: ["payment", "razorpay", "emi", "upi", "credit card"],
        helpful: 47,
        notHelpful: 1,
        lastUpdated: Date.now(),
        popularity: 78
      },
      {
        question: "Can I cancel or modify my order after placing it?",
        answer: "Orders can be cancelled within 2 hours of placement for full refund. Modifications possible before assembly begins. Contact us immediately via our support system or call our support line. Partial refunds available for cancelled components.",
        category: "Payment",
        tags: ["cancel", "modify", "refund", "order changes"],
        helpful: 25,
        notHelpful: 3,
        lastUpdated: Date.now(),
        popularity: 43
      },

      // Gaming Performance FAQs
      {
        question: "Which build should I choose for 1440p gaming at 60+ FPS?",
        answer: "For 1440p 60+ FPS, we recommend builds with RTX 4060 Ti or better. Our 'Performance Gamers' category builds (₹65K-85K) are optimized for this. Key specs: RTX 4060 Ti/4070, Ryzen 5 5600X or Intel i5-12400F, 16GB DDR4/DDR5 RAM.",
        category: "Gaming",
        tags: ["1440p", "gaming", "fps", "rtx 4060 ti", "performance"],
        helpful: 39,
        notHelpful: 2,
        lastUpdated: Date.now(),
        popularity: 81
      },
      {
        question: "What's the difference between RTX 4060 and RTX 4060 Ti for gaming?",
        answer: "RTX 4060 Ti offers 15-20% better performance than RTX 4060. RTX 4060 handles 1080p excellently, while 4060 Ti is better for 1440p gaming. The Ti version has more VRAM (16GB vs 8GB in some models), making it more future-proof for demanding games.",
        category: "Gaming",
        tags: ["rtx 4060", "rtx 4060 ti", "gpu comparison", "performance"],
        helpful: 31,
        notHelpful: 1,
        lastUpdated: Date.now(),
        popularity: 59
      }
    ];

    // Add FAQs to database
    faqData.forEach((faq, index) => {
      const id = `faq_${Date.now()}_${index}`;
      this.faqDatabase.set(id, { ...faq, id });
    });
  }

  // Build search index for fast text matching
  private buildSearchIndex() {
    this.faqDatabase.forEach((faq, id) => {
      const text = `${faq.question} ${faq.answer} ${faq.tags.join(' ')}`.toLowerCase();
      const words = text.split(/\s+/).filter(word => word.length > 2);

      words.forEach(word => {
        if (!this.searchIndex.has(word)) {
          this.searchIndex.set(word, new Set());
        }
        this.searchIndex.get(word)!.add(id);
      });
    });
  }

  // Smart search with multiple matching strategies
  search(query: string, maxResults: number = 10): SearchResult[] {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    // Track search
    this.searchHistory.push({
      query: normalizedQuery,
      timestamp: Date.now(),
      resultCount: 0 // Will be updated below
    });

    const results: SearchResult[] = [];
    const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 2);

    // 1. Exact question match (highest priority)
    this.faqDatabase.forEach(faq => {
      if (faq.question.toLowerCase().includes(normalizedQuery)) {
        results.push({
          item: faq,
          relevanceScore: 100,
          matchType: 'exact',
          highlightedText: this.highlightText(faq.question, normalizedQuery)
        });
      }
    });

    // 2. Partial text matching in answers
    this.faqDatabase.forEach(faq => {
      if (!results.some(r => r.item.id === faq.id)) {
        const answerMatch = faq.answer.toLowerCase().includes(normalizedQuery);
        const partialMatch = queryWords.some(word => 
          faq.question.toLowerCase().includes(word) || faq.answer.toLowerCase().includes(word)
        );

        if (answerMatch || partialMatch) {
          const relevanceScore = this.calculateRelevanceScore(faq, queryWords, normalizedQuery);
          results.push({
            item: faq,
            relevanceScore,
            matchType: answerMatch ? 'partial' : 'semantic',
            highlightedText: this.highlightText(faq.answer, normalizedQuery)
          });
        }
      }
    });

    // 3. Tag-based matching
    this.faqDatabase.forEach(faq => {
      if (!results.some(r => r.item.id === faq.id)) {
        const tagMatch = faq.tags.some(tag => 
          tag.toLowerCase().includes(normalizedQuery) ||
          queryWords.some(word => tag.toLowerCase().includes(word))
        );

        if (tagMatch) {
          results.push({
            item: faq,
            relevanceScore: 60 + faq.popularity * 0.3,
            matchType: 'tag',
            highlightedText: faq.question
          });
        }
      }
    });

    // Sort by relevance score and popularity
    const sortedResults = results
      .sort((a, b) => {
        const scoreA = a.relevanceScore + (a.item.popularity * 0.1) + (a.item.helpful * 0.5);
        const scoreB = b.relevanceScore + (b.item.popularity * 0.1) + (b.item.helpful * 0.5);
        return scoreB - scoreA;
      })
      .slice(0, maxResults);

    // Update search history with result count
    this.searchHistory[this.searchHistory.length - 1].resultCount = sortedResults.length;

    return sortedResults;
  }

  // Calculate relevance score based on multiple factors
  private calculateRelevanceScore(faq: FAQItem, queryWords: string[], fullQuery: string): number {
    let score = 0;

    // Exact phrase bonus
    if (faq.question.toLowerCase().includes(fullQuery)) score += 50;
    if (faq.answer.toLowerCase().includes(fullQuery)) score += 40;

    // Word frequency scoring
    queryWords.forEach(word => {
      const questionMatches = (faq.question.toLowerCase().match(new RegExp(word, 'g')) || []).length;
      const answerMatches = (faq.answer.toLowerCase().match(new RegExp(word, 'g')) || []).length;
      score += questionMatches * 10 + answerMatches * 5;
    });

    // Tag relevance
    faq.tags.forEach(tag => {
      if (queryWords.some(word => tag.toLowerCase().includes(word))) {
        score += 15;
      }
    });

    // Popularity bonus
    score += faq.popularity * 0.2;

    // Helpfulness bonus
    const helpfulnessRatio = faq.helpful / Math.max(1, faq.helpful + faq.notHelpful);
    score += helpfulnessRatio * 10;

    return Math.min(100, score);
  }

  // Highlight matching text in results
  private highlightText(text: string, query: string): string {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // Get FAQ by ID
  getFAQ(id: string): FAQItem | null {
    return this.faqDatabase.get(id) || null;
  }

  // Rate FAQ helpfulness
  async rateFAQ(id: string, isHelpful: boolean): Promise<void> {
    const faq = this.faqDatabase.get(id);
    if (faq) {
      if (isHelpful) {
        faq.helpful++;
      } else {
        faq.notHelpful++;
      }
      
      // Update popularity based on interactions
      faq.popularity = Math.min(100, faq.popularity + (isHelpful ? 1 : -0.5));
      
      // Persist changes
      await this.persistFAQ(faq);
    }
  }

  // Get popular FAQs
  getPopularFAQs(limit: number = 5): FAQItem[] {
    return Array.from(this.faqDatabase.values())
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  // Get FAQs by category
  getFAQsByCategory(category: string): FAQItem[] {
    return Array.from(this.faqDatabase.values())
      .filter(faq => faq.category === category)
      .sort((a, b) => b.popularity - a.popularity);
  }

  // Get all categories
  getCategories(): string[] {
    const categories = new Set<string>();
    this.faqDatabase.forEach(faq => categories.add(faq.category));
    return Array.from(categories).sort();
  }

  // Advanced semantic search using keyword matching
  semanticSearch(query: string): SearchResult[] {
    const semanticMappings = {
      'slow': ['performance', 'speed', 'lag', 'fps'],
      'hot': ['temperature', 'cooling', 'thermal', 'overheating'],
      'loud': ['noise', 'fan', 'quiet', 'cooling'],
      'expensive': ['budget', 'cheap', 'affordable', 'price'],
      'good': ['best', 'recommended', 'quality', 'reliable'],
      'streaming': ['content creation', 'obs', 'encoding', 'broadcast'],
      'work': ['productivity', 'office', 'professional', 'business']
    };

    const expandedQuery = query.toLowerCase();
    let enhancedQuery = expandedQuery;

    // Expand query with semantic terms
    Object.entries(semanticMappings).forEach(([key, synonyms]) => {
      if (expandedQuery.includes(key)) {
        enhancedQuery += ' ' + synonyms.join(' ');
      }
    });

    return this.search(enhancedQuery);
  }

  // Get search analytics
  getSearchAnalytics(): FAQAnalytics {
    const allFAQs = Array.from(this.faqDatabase.values());
    
    // Calculate top search terms
    const termCounts = new Map<string, number>();
    this.searchHistory.forEach(search => {
      const words = search.query.split(/\s+/).filter(word => word.length > 3);
      words.forEach(word => {
        termCounts.set(word, (termCounts.get(word) || 0) + 1);
      });
    });

    const topSearchTerms = Array.from(termCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([term, count]) => ({ term, count }));

    // Most and least helpful FAQs
    const mostHelpfulFAQs = allFAQs
      .sort((a, b) => {
        const ratioA = a.helpful / Math.max(1, a.helpful + a.notHelpful);
        const ratioB = b.helpful / Math.max(1, b.helpful + b.notHelpful);
        return ratioB - ratioA;
      })
      .slice(0, 5);

    const leastHelpfulFAQs = allFAQs
      .filter(faq => (faq.helpful + faq.notHelpful) > 5) // Minimum interactions
      .sort((a, b) => {
        const ratioA = a.helpful / Math.max(1, a.helpful + a.notHelpful);
        const ratioB = b.helpful / Math.max(1, b.helpful + b.notHelpful);
        return ratioA - ratioB;
      })
      .slice(0, 3);

    // Category popularity
    const categoryPopularity = allFAQs.reduce((acc, faq) => {
      acc[faq.category] = (acc[faq.category] || 0) + faq.popularity;
      return acc;
    }, {} as Record<string, number>);

    // Search success rate (searches that returned results)
    const successfulSearches = this.searchHistory.filter(search => search.resultCount > 0).length;
    const searchSuccessRate = this.searchHistory.length > 0 
      ? (successfulSearches / this.searchHistory.length) * 100 
      : 0;

    return {
      totalQuestions: allFAQs.length,
      totalSearches: this.searchHistory.length,
      topSearchTerms,
      mostHelpfulFAQs,
      leastHelpfulFAQs,
      categoryPopularity,
      searchSuccessRate
    };
  }

  // Suggest FAQ improvements based on failed searches
  suggestImprovements(): Array<{ searchTerm: string; frequency: number; suggested: string }> {
    const failedSearches = this.searchHistory.filter(search => search.resultCount === 0);
    const suggestions: Array<{ searchTerm: string; frequency: number; suggested: string }> = [];

    // Count failed search terms
    const termCounts = new Map<string, number>();
    failedSearches.forEach(search => {
      const term = search.query;
      termCounts.set(term, (termCounts.get(term) || 0) + 1);
    });

    // Generate suggestions for frequent failed searches
    Array.from(termCounts.entries())
      .filter(([,count]) => count >= 3) // Minimum 3 failed searches
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([term, frequency]) => {
        suggestions.push({
          searchTerm: term,
          frequency,
          suggested: `Consider adding FAQ about: "${term}"`
        });
      });

    return suggestions;
  }

  // Persist FAQ to storage
  private async persistFAQ(faq: FAQItem): Promise<void> {
    try {
      // In production, save to Firebase
      localStorage.setItem(`faq_${faq.id}`, JSON.stringify(faq));
    } catch (error) {
      console.error('Error persisting FAQ:', error);
    }
  }
}

export const faqSearchService = new FAQSearchService();